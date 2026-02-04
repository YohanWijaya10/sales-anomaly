import { AggregatedMetrics } from "@/lib/analytics/computeDailyMetrics";
import {
  SalesmanRedFlags,
  countRedFlagsBySeverity,
} from "@/lib/analytics/redFlags";
import { formatCurrency, formatPercentage } from "@/lib/utils/date";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;

export interface DailyInsight {
  date: string;
  highlights: string[];
  risks: string[];
  actions: string[];
  notes: string;
}

export interface WeeklyInsight {
  period: { from: string; to: string };
  summary: {
    highlights: string[];
    risks: string[];
    actions: string[];
  };
  detail: string;
  notes: string;
}

export interface SalesPerformanceInsights {
  period: { from: string; to: string };
  insights: string[];
}

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const url = `${DEEPSEEK_BASE_URL}/chat/completions`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: "json_object" },
          }),
        },
        TIMEOUT_MS,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepSeek API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as DeepSeekResponse;
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("DeepSeek API call failed after retries");
}

function buildInsightPrompt(
  metrics: AggregatedMetrics,
  redFlags: SalesmanRedFlags[],
): string {
  const flagCounts = countRedFlagsBySeverity(redFlags);

  // Find top performers
  const sortedByConversion = [...metrics.salesmen_metrics]
    .filter((m) => m.visit_count > 0)
    .sort((a, b) => b.conversion_rate - a.conversion_rate);

  const sortedBySales = [...metrics.salesmen_metrics].sort(
    (a, b) => b.total_sales_amount - a.total_sales_amount,
  );

  const topByConversion = sortedByConversion.slice(0, 2);
  const bottomByConversion = sortedByConversion.slice(-2).reverse();
  const topBySales = sortedBySales.slice(0, 2);

  // Build prompt data
  const promptData = {
    date: metrics.date,
    summary: {
      total_visits: metrics.total_visits,
      total_salesmen: metrics.total_salesmen,
      total_sales_amount: metrics.total_sales_amount,
      total_sales_qty: metrics.total_sales_qty,
      avg_conversion_rate: metrics.avg_conversion_rate,
    },
    top_by_conversion: topByConversion.map((m) => ({
      name: m.salesman_name,
      conversion_rate: m.conversion_rate,
      sales_amount: m.total_sales_amount,
    })),
    bottom_by_conversion: bottomByConversion.map((m) => ({
      name: m.salesman_name,
      conversion_rate: m.conversion_rate,
      visits: m.visit_count,
    })),
    top_by_sales: topBySales.map((m) => ({
      name: m.salesman_name,
      sales_amount: m.total_sales_amount,
      qty: m.total_sales_qty,
    })),
    red_flags: {
      total_count: redFlags.length,
      high_severity: flagCounts.high,
      medium_severity: flagCounts.medium,
      low_severity: flagCounts.low,
      details: redFlags.map((rf) => ({
        salesman: rf.salesman_name,
        flags: rf.red_flags.map((f) => f.title),
      })),
    },
  };

  return JSON.stringify(promptData, null, 2);
}

export async function generateDailyInsight(
  metrics: AggregatedMetrics,
  redFlags: SalesmanRedFlags[],
): Promise<DailyInsight> {
  const dataPrompt = buildInsightPrompt(metrics, redFlags);

  const systemPrompt = `Anda adalah asisten analitik sales. Analisis data kunjungan sales harian dan berikan insight yang dapat ditindaklanjuti.

ATURAN PENTING:
1. Keluarkan HANYA JSON yang valid dengan format yang persis seperti ditentukan
2. Jangan menuduh siapa pun melakukan kecurangan atau pelanggaran - gunakan frasa seperti "perlu ditinjau" atau "perlu perhatian"
3. Ringkas namun spesifik
4. Fokus pada insight yang dapat ditindaklanjuti

FORMAT OUTPUT (JSON ketat):
{
  "date": "YYYY-MM-DD",
  "highlights": ["array string berisi 2-3 hal positif"],
  "risks": ["array string berisi 2-3 risiko atau hal yang perlu perhatian"],
  "actions": ["array string berisi 2-3 tindakan yang direkomendasikan"],
  "notes": "string tunggal untuk konteks tambahan"
}`;

  const userPrompt = `Analisis data kunjungan sales tanggal ${metrics.date}:

${dataPrompt}

Berikan insight sesuai format JSON yang ditentukan.`;

  try {
    const response = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const parsed = JSON.parse(response) as DailyInsight;

    // Validate the response structure
    if (
      !parsed.date ||
      !Array.isArray(parsed.highlights) ||
      !Array.isArray(parsed.risks) ||
      !Array.isArray(parsed.actions) ||
      typeof parsed.notes !== "string"
    ) {
      throw new Error("Invalid response structure");
    }

    return parsed;
  } catch (error) {
    // Return fallback deterministic insight
    return generateFallbackInsight(metrics, redFlags);
  }
}

function buildWeeklyPrompt(input: {
  period: { from: string; to: string };
  totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    total_salesmen: number;
  };
  prev_totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    total_salesmen: number;
    period: { from: string; to: string };
  };
  topBySales: Array<{ name: string; amount: number }>;
  topByConversion: Array<{ name: string; rate: number }>;
  topLeadersBySales: Array<{ name: string; amount: number }>;
  topSalesmanBySales: { name: string; amount: number } | null;
  topRegionByVisits: { name: string; visit_count: number } | null;
  lowConversionRegion: {
    name: string;
    visit_count: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  } | null;
  poorPerformers: Array<{
    name: string;
    count: number;
    visit_count_week: number;
    total_sales_amount: number;
    conversion_rate: number;
    outlet_with_sales_count: number;
  }>;
  salesPerformance: Array<{
    salesman_id: string;
    name: string;
    visit_count_week: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
  }>;
  regions: Array<{
    id: string;
    name: string;
    visit_count: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  prev_regions: Array<{
    id: string;
    name: string;
    visit_count: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  redFlagCounts: { high: number; medium: number; low: number };
}): string {
  return JSON.stringify(input, null, 2);
}

export async function generateWeeklyInsight(input: {
  period: { from: string; to: string };
  totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    total_salesmen: number;
  };
  prev_totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    total_salesmen: number;
    period: { from: string; to: string };
  };
  topBySales: Array<{ name: string; amount: number }>;
  topByConversion: Array<{ name: string; rate: number }>;
  topLeadersBySales: Array<{ name: string; amount: number }>;
  topSalesmanBySales: { name: string; amount: number } | null;
  topRegionByVisits: { name: string; visit_count: number } | null;
  lowConversionRegion: {
    name: string;
    visit_count: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  } | null;
  poorPerformers: Array<{
    name: string;
    count: number;
    visit_count_week: number;
    total_sales_amount: number;
    conversion_rate: number;
    outlet_with_sales_count: number;
  }>;
  salesPerformance: Array<{
    salesman_id: string;
    name: string;
    visit_count_week: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
  }>;
  regions: Array<{
    id: string;
    name: string;
    visit_count: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  prev_regions: Array<{
    id: string;
    name: string;
    visit_count: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  redFlagCounts: { high: number; medium: number; low: number };
}): Promise<WeeklyInsight> {
  const dataPrompt = buildWeeklyPrompt(input);

  const systemPrompt = `Anda adalah asisten analitik sales. Buat laporan mingguan dengan format ringkas + detail.

ATURAN PENTING:
1. Keluarkan HANYA JSON yang valid dengan format yang persis seperti ditentukan
2. Jangan menuduh siapa pun melakukan kecurangan atau pelanggaran
3. Hindari kata "bendera" atau "red flag" dalam output
4. Ringkas namun spesifik
5. Ikuti definisi ketat Sorotan/Risiko/Tindakan di bawah

FORMAT OUTPUT (JSON ketat):
{
  "period": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "summary": {
    "highlights": ["array string berisi 5 poin sorotan"],
    "risks": ["array string berisi 1-3 risiko"],
    "actions": ["array string berisi 1-3 tindakan mitigasi"]
  },
  "detail": "paragraf singkat (3-5 kalimat) yang merangkum performa minggu ini",
  "notes": "string tunggal untuk konteks tambahan"
}

DEFINISI KETAT:
- Sorotan: HANYA laporan fakta (metrik, top performer, deskripsi kejadian). Tidak boleh berisi risiko, saran, atau prediksi.
- Risiko: HANYA hal yang dapat menyebabkan kerugian bisnis dalam 30 hari ke depan. Maks 1 risiko utama + 2 risiko sekunder.
- Tindakan: HANYA langkah mitigasi yang secara langsung menjawab risiko yang disebutkan. Tidak boleh ada aksi yang tidak terkait risiko.
- Setiap tindakan WAJIB menyebut target risiko (contoh: "Mitigasi Risiko 1: ...").
- Format Risiko Utama WAJIB satu kalimat: "[WHAT], which may [BUSINESS IMPACT], if not addressed within [TIMEFRAME]."
- Risiko sekunder boleh singkat tanpa penjelasan.
- Jika tidak ada risiko valid, isi risks dengan: ["Tidak ada risiko kritis minggu ini."] dan actions harus [].

FORMAT SOROTAN (WAJIB 5 poin, urutan tetap):
1) Total penjualan + unit terjual, bandingkan dengan minggu sebelumnya.
2) Rata-rata konversi, bandingkan dengan minggu sebelumnya.
3) Performa leader terbaik (sebutkan nama).
4) Sales dengan performa terbaik (sebutkan nama).
5) Daerah (region) dengan kunjungan paling ramai.
}`;

  const userPrompt = `Analisis data mingguan berikut dan buat laporan sesuai format JSON:

${dataPrompt}

Patuhi DEFINISI KETAT. Pastikan:
- Sorotan hanya fakta.
- Risiko hanya risiko berdampak 30 hari ke depan, bukan peluang.
- Tindakan harus langsung merespons Risiko dan menyebut "Risiko 1/2/3".
- Risiko utama harus satu kalimat dengan format: "[WHAT], which may [BUSINESS IMPACT], if not addressed within [TIMEFRAME]."
- Sorotan harus mengikuti urutan 1-5 sesuai FORMAT SOROTAN dan menyertakan perbandingan vs minggu sebelumnya.
`;

  try {
    const response = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const parsed = JSON.parse(response) as WeeklyInsight;

    if (
      !parsed.period ||
      !parsed.summary ||
      !Array.isArray(parsed.summary.highlights) ||
      !Array.isArray(parsed.summary.risks) ||
      !Array.isArray(parsed.summary.actions) ||
      typeof parsed.detail !== "string" ||
      typeof parsed.notes !== "string"
    ) {
      throw new Error("Invalid response structure");
    }

    return normalizeWeeklyInsight(parsed, input);
  } catch {
    return generateWeeklyFallbackInsight(input);
  }
}

function buildWeeklyHighlights(input: {
  totals: {
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
  };
  prev_totals: {
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
  };
  topLeadersBySales: Array<{ name: string; amount: number }>;
  topSalesmanBySales: { name: string; amount: number } | null;
  topRegionByVisits: { name: string; visit_count: number } | null;
}): string[] {
  const trendLabel = (current: number, prev: number) => {
    if (current > prev) return "naik";
    if (current < prev) return "turun";
    return "stabil";
  };

  const totalSalesTrend = trendLabel(
    input.totals.total_sales_amount,
    input.prev_totals.total_sales_amount,
  );
  const salesHighlight = `Total penjualan ${formatCurrency(
    input.totals.total_sales_amount,
  )} dengan ${input.totals.total_sales_qty} unit terjual, ${totalSalesTrend} dibanding minggu lalu (${formatCurrency(
    input.prev_totals.total_sales_amount,
  )} dan ${input.prev_totals.total_sales_qty} unit).`;

  const conversionTrend = trendLabel(
    input.totals.avg_conversion_rate,
    input.prev_totals.avg_conversion_rate,
  );
  const conversionHighlight = `Rata-rata konversi ${formatPercentage(
    input.totals.avg_conversion_rate,
  )}, ${conversionTrend} dibanding minggu lalu (${formatPercentage(
    input.prev_totals.avg_conversion_rate,
  )}).`;

  const leaderNames =
    input.topLeadersBySales.length > 0
      ? input.topLeadersBySales.map((l) => l.name).join(" dan ")
      : "Belum ada leader dengan kontribusi penjualan signifikan";
  const leaderHighlight = `Performa leader terbaik minggu ini: ${leaderNames}.`;

  const topSalesHighlight = input.topSalesmanBySales
    ? `Sales dengan performa terbaik: ${input.topSalesmanBySales.name}.`
    : "Belum ada sales dengan performa penjualan menonjol minggu ini.";

  const topRegionHighlight = input.topRegionByVisits
    ? `Daerah paling ramai minggu ini: ${input.topRegionByVisits.name}.`
    : "Belum ada data kunjungan region yang dominan minggu ini.";

  return [
    salesHighlight,
    conversionHighlight,
    leaderHighlight,
    topSalesHighlight,
    topRegionHighlight,
  ];
}

function normalizeWeeklyInsight(
  input: WeeklyInsight,
  context: {
    totals: {
      total_visits: number;
      total_sales_amount: number;
      total_sales_qty: number;
      avg_conversion_rate: number;
    };
    prev_totals: {
      total_visits: number;
      total_sales_amount: number;
      total_sales_qty: number;
      avg_conversion_rate: number;
    };
    topLeadersBySales: Array<{ name: string; amount: number }>;
    topSalesmanBySales: { name: string; amount: number } | null;
    topRegionByVisits: { name: string; visit_count: number } | null;
    lowConversionRegion: {
      name: string;
      visit_count: number;
      outlet_with_sales_count: number;
      conversion_rate: number;
    } | null;
    poorPerformers: Array<{ name: string; count: number }>;
    salesPerformance: Array<{
      salesman_id: string;
      name: string;
      visit_count_week: number;
      total_sales_amount: number;
      outlet_with_sales_count: number;
    }>;
    regions: Array<{
      id: string;
      name: string;
      visit_count: number;
      total_sales_amount: number;
      outlet_with_sales_count: number;
      conversion_rate: number;
    }>;
    prev_regions: Array<{
      id: string;
      name: string;
      visit_count: number;
      total_sales_amount: number;
      outlet_with_sales_count: number;
      conversion_rate: number;
    }>;
  },
): WeeklyInsight {
  const forbiddenRiskKeywords = [
    "peluang",
    "opportunity",
    "optimasi",
    "optimalisasi",
    "growth",
    "pertumbuhan",
    "eksplorasi",
    "potensi",
  ];
  const isValidRisk = (risk: string) =>
    !forbiddenRiskKeywords.some((k) => risk.toLowerCase().includes(k));

  const risks = Array.isArray(input.summary?.risks) ? input.summary.risks : [];
  const actions = Array.isArray(input.summary?.actions)
    ? input.summary.actions
    : [];

  const buildRisks = (): string[] => {
    const result: string[] = [];

    const salesPerf = context.salesPerformance || [];
    const lowConversionSales = salesPerf
      .filter((s) => s.visit_count_week > 0)
      .map((s) => ({
        ...s,
        conversion_rate:
          s.visit_count_week > 0
            ? s.outlet_with_sales_count / s.visit_count_week
            : 0,
      }))
      .filter((s) => s.conversion_rate < 0.3)
      .sort((a, b) => a.conversion_rate - b.conversion_rate)
      .slice(0, 3);

    const zeroSales = salesPerf
      .filter((s) => s.visit_count_week > 0 && s.total_sales_amount === 0)
      .slice(0, 2);

    // Risk 1: Sales dengan performa rendah
    if (lowConversionSales.length > 0 || zeroSales.length > 0) {
      const parts: string[] = [];

      if (zeroSales.length > 0) {
        const names = zeroSales.map((s) => s.name);
        if (zeroSales.length === 1) {
          parts.push(
            `${names[0]} perlu perhatian khusus karena dari ${zeroSales[0].visit_count_week} kunjungan belum ada yang berhasil closing`,
          );
        } else {
          parts.push(
            `${names.join(" dan ")} belum menghasilkan deal sama sekali meski sudah melakukan banyak kunjungan`,
          );
        }
      }

      const otherLowConv = lowConversionSales.filter(
        (s) => !zeroSales.some((z) => z.name === s.name),
      );
      if (otherLowConv.length > 0) {
        const convTexts = otherLowConv.map(
          (s) =>
            `${s.name} hanya ${s.outlet_with_sales_count} deal dari ${s.visit_count_week} kunjungan`,
        );
        parts.push(convTexts.join(", "));
      }

      result.push(parts.join(". ") + ".");
    }

    // Risk 2: Wilayah dengan konversi rendah
    const lowRegions = (context.regions || [])
      .filter((r) => r.visit_count > 0 && r.conversion_rate < 0.3)
      .sort((a, b) => a.conversion_rate - b.conversion_rate)
      .slice(0, 2);

    if (lowRegions.length > 0) {
      if (lowRegions.length === 1) {
        const r = lowRegions[0];
        result.push(
          `Wilayah ${r.name} masih jadi tantangan dengan tingkat closing hanya ${formatPercentage(r.conversion_rate)} (${r.outlet_with_sales_count} deal dari ${r.visit_count} kunjungan).`,
        );
      } else {
        const regionTexts = lowRegions.map(
          (r) => `${r.name} (${formatPercentage(r.conversion_rate)})`,
        );
        result.push(
          `${regionTexts.join(" dan ")} masih perlu perbaikan strategi karena tingkat closing-nya di bawah 30%.`,
        );
      }
    }

    // Risk 3: Wilayah dengan penurunan signifikan
    const prevRegionMap = new Map(
      (context.prev_regions || []).map((r) => [r.id, r]),
    );
    const decliningRegions = (context.regions || [])
      .map((r) => {
        const prev = prevRegionMap.get(r.id);
        if (!prev || prev.total_sales_amount <= 0) return null;
        const dropPct =
          ((prev.total_sales_amount - r.total_sales_amount) /
            prev.total_sales_amount) *
          100;
        return {
          id: r.id,
          name: r.name,
          prevSales: prev.total_sales_amount,
          currentSales: r.total_sales_amount,
          dropPct,
        };
      })
      .filter((r): r is NonNullable<typeof r> => !!r && r.dropPct >= 20)
      .sort((a, b) => b.dropPct - a.dropPct)
      .slice(0, 2);

    if (decliningRegions.length > 0) {
      if (decliningRegions.length === 1) {
        const r = decliningRegions[0];
        result.push(
          `Penjualan di ${r.name} turun ${r.dropPct.toFixed(0)}% dibanding minggu lalu, dari ${formatCurrency(r.prevSales)} menjadi ${formatCurrency(r.currentSales)}.`,
        );
      } else {
        const texts = decliningRegions.map(
          (r) => `${r.name} turun ${r.dropPct.toFixed(0)}%`,
        );
        result.push(
          `Beberapa wilayah mengalami penurunan penjualan yang cukup signifikan: ${texts.join(" dan ")}.`,
        );
      }
    }

    // Risk 4: Penurunan kunjungan
    if (
      context.prev_totals.total_visits > 0 &&
      context.totals.total_visits < context.prev_totals.total_visits
    ) {
      const drop =
        ((context.prev_totals.total_visits - context.totals.total_visits) /
          context.prev_totals.total_visits) *
        100;
      result.push(
        `Aktivitas kunjungan menurun ${drop.toFixed(0)}% dari minggu sebelumnya (${context.prev_totals.total_visits} → ${context.totals.total_visits} kunjungan), ini bisa berdampak pada pipeline penjualan.`,
      );
    }

    // Risk 5: Penurunan konversi
    if (
      context.totals.avg_conversion_rate <
      context.prev_totals.avg_conversion_rate
    ) {
      const dropPp =
        (context.prev_totals.avg_conversion_rate -
          context.totals.avg_conversion_rate) *
        100;
      if (dropPp >= 1) {
        result.push(
          `Rata-rata closing rate turun ${dropPp.toFixed(1)} poin dari ${formatPercentage(context.prev_totals.avg_conversion_rate)} menjadi ${formatPercentage(context.totals.avg_conversion_rate)}.`,
        );
      }
    }

    // Risk 6: Penurunan penjualan total
    if (
      context.totals.total_sales_amount < context.prev_totals.total_sales_amount
    ) {
      const dropValue =
        context.prev_totals.total_sales_amount -
        context.totals.total_sales_amount;
      const dropPct =
        (dropValue / context.prev_totals.total_sales_amount) * 100;
      result.push(
        `Total penjualan minggu ini lebih rendah ${formatCurrency(dropValue)} (${dropPct.toFixed(1)}%) dibanding minggu lalu.`,
      );
    }

    const filtered = result.filter((r) => isValidRisk(r));
    return filtered.length > 0
      ? filtered
      : [
          "Secara umum performa minggu ini cukup stabil tanpa risiko yang signifikan.",
        ];
  };

  const normalizedRisks = buildRisks();

  const actionPattern = /risiko\s*[1-3]/i;
  const normalizedActions =
    normalizedRisks[0] ===
    "Secara umum performa minggu ini cukup stabil tanpa risiko yang signifikan."
      ? []
      : actions.filter((a) => actionPattern.test(a)).slice(0, 3);

  const forcedHighlights = buildWeeklyHighlights(context);

  return {
    ...input,
    summary: {
      highlights: forcedHighlights,
      risks: normalizedRisks,
      actions: normalizedActions,
    },
  };
}

export function generateWeeklyFallbackInsight(input: {
  period: { from: string; to: string };
  totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    total_salesmen: number;
  };
  prev_totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    total_salesmen: number;
    period: { from: string; to: string };
  };
  topBySales: Array<{ name: string; amount: number }>;
  topByConversion: Array<{ name: string; rate: number }>;
  topLeadersBySales: Array<{ name: string; amount: number }>;
  topSalesmanBySales: { name: string; amount: number } | null;
  topRegionByVisits: { name: string; visit_count: number } | null;
  lowConversionRegion: {
    name: string;
    visit_count: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  } | null;
  poorPerformers: Array<{
    name: string;
    count: number;
    visit_count_week: number;
    total_sales_amount: number;
    conversion_rate: number;
    outlet_with_sales_count: number;
  }>;
  salesPerformance: Array<{
    salesman_id: string;
    name: string;
    visit_count_week: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
  }>;
  regions: Array<{
    id: string;
    name: string;
    visit_count: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  prev_regions: Array<{
    id: string;
    name: string;
    visit_count: number;
    total_sales_amount: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  redFlagCounts: { high: number; medium: number; low: number };
}): WeeklyInsight {
  const highlights = buildWeeklyHighlights({
    totals: {
      total_sales_amount: input.totals.total_sales_amount,
      total_sales_qty: input.totals.total_sales_qty,
      avg_conversion_rate: input.totals.avg_conversion_rate,
    },
    prev_totals: {
      total_sales_amount: input.prev_totals.total_sales_amount,
      total_sales_qty: input.prev_totals.total_sales_qty,
      avg_conversion_rate: input.prev_totals.avg_conversion_rate,
    },
    topLeadersBySales: input.topLeadersBySales,
    topSalesmanBySales: input.topSalesmanBySales,
    topRegionByVisits: input.topRegionByVisits,
  });

  const baseInsight: WeeklyInsight = {
    period: input.period,
    summary: { highlights, risks: [], actions: [] },
    detail:
      "Secara umum performa minggu ini stabil dengan kontribusi utama dari beberapa sales teratas. Rata-rata konversi dan volume kunjungan bergerak sejalan dengan distribusi aktivitas sales selama periode ini.",
    notes: "Laporan ini dihasilkan otomatis dari data mingguan.",
  };

  return normalizeWeeklyInsight(baseInsight, {
    totals: {
      total_visits: input.totals.total_visits,
      total_sales_amount: input.totals.total_sales_amount,
      total_sales_qty: input.totals.total_sales_qty,
      avg_conversion_rate: input.totals.avg_conversion_rate,
    },
    prev_totals: {
      total_visits: input.prev_totals.total_visits,
      total_sales_amount: input.prev_totals.total_sales_amount,
      total_sales_qty: input.prev_totals.total_sales_qty,
      avg_conversion_rate: input.prev_totals.avg_conversion_rate,
    },
    topLeadersBySales: input.topLeadersBySales,
    topSalesmanBySales: input.topSalesmanBySales,
    topRegionByVisits: input.topRegionByVisits,
    lowConversionRegion: input.lowConversionRegion,
    poorPerformers: input.poorPerformers,
    salesPerformance: input.salesPerformance,
    regions: input.regions,
    prev_regions: input.prev_regions,
  });
}

export async function generateSalesPerformanceInsights(input: {
  period: { from: string; to: string };
  totals: {
    total_visits: number;
    total_sales_amount: number;
    total_sales_qty: number;
  };
  topByConversion: Array<{ name: string; conversion_rate: number; visits: number }>;
  topBySales: Array<{ name: string; total_sales_amount: number }>;
  outletTypeShare: Array<{
    salesman_name: string;
    outlet_type: string;
    visit_count: number;
    share: number;
  }>;
  timeOfDay: Array<{
    salesman_name: string;
    daypart: string;
    visit_count: number;
    success_rate: number;
  }>;
  visitPerDayBins: Array<{
    label: string;
    salesmen_count: number;
    conversion_rate: number;
  }>;
}): Promise<SalesPerformanceInsights> {
  const systemPrompt = `Anda adalah analis performa sales. Buat insight singkat dan actionable berdasarkan data agregat.

ATURAN PENTING:
1. Keluarkan HANYA JSON valid sesuai format yang diminta.
2. Jangan mengada-ada. Jika data tidak cukup, tulis insight yang aman.
3. Setiap insight 1 kalimat, maksimal 20 kata.
4. Gunakan angka persis yang diberikan.

FORMAT OUTPUT:
{
  "period": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "insights": ["3-5 kalimat insight"]
}`;

  const userPrompt = `Data agregat periode ${input.period.from} – ${input.period.to}:

${JSON.stringify(input, null, 2)}

Hasilkan 3-5 insight yang actionable. Contoh pola:
- Sales unggul karena fokus tipe outlet tertentu (jika outletTypeShare tersedia).
- Waktu kunjungan tertentu memiliki success rate rendah/tinggi (jika timeOfDay tersedia).
- Pola kunjungan per hari vs konversi (jika visitPerDayBins tersedia).
`;

  try {
    const response = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const parsed = JSON.parse(response) as SalesPerformanceInsights;
    if (
      !parsed.period ||
      !Array.isArray(parsed.insights) ||
      parsed.insights.length === 0
    ) {
      throw new Error("Invalid response structure");
    }

    return parsed;
  } catch {
    const fallback = buildSalesPerformanceFallback(input);
    return { period: input.period, insights: fallback };
  }
}

function buildSalesPerformanceFallback(input: {
  topByConversion: Array<{ name: string; conversion_rate: number; visits: number }>;
  outletTypeShare: Array<{
    salesman_name: string;
    outlet_type: string;
    visit_count: number;
    share: number;
  }>;
  timeOfDay: Array<{
    salesman_name: string;
    daypart: string;
    visit_count: number;
    success_rate: number;
  }>;
  visitPerDayBins: Array<{
    label: string;
    salesmen_count: number;
    conversion_rate: number;
  }>;
}): string[] {
  const insights: string[] = [];

  if (input.topByConversion.length > 0) {
    const top = input.topByConversion[0];
    insights.push(
      `${top.name} memimpin konversi ${formatPercentage(
        top.conversion_rate
      )} dari ${top.visits} kunjungan.`,
    );
  }

  const topType = input.outletTypeShare
    .filter((o) => o.share >= 0.5)
    .sort((a, b) => b.share - a.share)[0];
  if (topType) {
    insights.push(
      `${topType.salesman_name} dominan di ${topType.outlet_type} (${formatPercentage(
        topType.share
      )} kunjungan).`,
    );
  }

  const lowTime = input.timeOfDay
    .filter((t) => t.visit_count >= 5)
    .sort((a, b) => a.success_rate - b.success_rate)[0];
  if (lowTime && lowTime.success_rate < 0.2) {
    insights.push(
      `${lowTime.salesman_name} rendah di ${lowTime.daypart} (${formatPercentage(
        lowTime.success_rate
      )}), pertimbangkan ganti jadwal.`,
    );
  }

  const bestBin = input.visitPerDayBins
    .filter((b) => b.salesmen_count > 0)
    .sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
  if (bestBin) {
    insights.push(
      `Pola ${bestBin.label} kunjungan/hari menunjukkan konversi tertinggi (${formatPercentage(
        bestBin.conversion_rate
      )}).`,
    );
  }

  if (insights.length === 0) {
    insights.push("Data belum cukup untuk insight spesifik minggu ini.");
  }

  return insights.slice(0, 5);
}

export function generateFallbackInsight(
  metrics: AggregatedMetrics,
  redFlags: SalesmanRedFlags[],
): DailyInsight {
  const flagCounts = countRedFlagsBySeverity(redFlags);

  const highlights: string[] = [];
  const risks: string[] = [];
  const actions: string[] = [];

  // Generate highlights
  if (metrics.total_visits > 0) {
    highlights.push(
      `Total ${metrics.total_visits} kunjungan tercatat oleh ${metrics.total_salesmen} sales`,
    );
  }

  if (metrics.total_sales_amount > 0) {
    highlights.push(
      `Total penjualan sebesar ${formatCurrency(metrics.total_sales_amount)} (${metrics.total_sales_qty} unit)`,
    );
  }

  if (metrics.avg_conversion_rate > 0.5) {
    highlights.push(
      `Rata-rata konversi ${formatPercentage(metrics.avg_conversion_rate)} melebihi 50%`,
    );
  }

  if (highlights.length === 0) {
    highlights.push("Tidak ada aktivitas signifikan pada tanggal ini");
  }

  // Generate risks
  if (flagCounts.high > 0) {
    risks.push(
      `${flagCounts.high} pola dengan tingkat tinggi terdeteksi dan perlu ditinjau segera`,
    );
  }

  if (flagCounts.medium > 0) {
    risks.push(`${flagCounts.medium} pola tingkat sedang perlu perhatian`);
  }

  if (metrics.avg_conversion_rate < 0.3 && metrics.total_visits > 0) {
    risks.push(
      `Rata-rata konversi rendah: ${formatPercentage(metrics.avg_conversion_rate)}`,
    );
  }

  if (risks.length === 0) {
    risks.push("Tidak ada risiko signifikan yang teridentifikasi");
  }

  // Generate actions
  if (redFlags.length > 0) {
    const flaggedNames = redFlags.slice(0, 2).map((r) => r.salesman_name);
    actions.push(`Tinjau pola aktivitas untuk: ${flaggedNames.join(", ")}`);
  }

  if (metrics.avg_conversion_rate < 0.3 && metrics.total_visits > 0) {
    actions.push(
      "Investigasi outlet dengan konversi rendah dan berikan pelatihan sales",
    );
  }

  const zeroSales = metrics.salesmen_metrics.filter(
    (m) => m.visit_count > 0 && m.total_sales_amount === 0,
  );
  if (zeroSales.length > 0) {
    actions.push(
      `Tindak lanjuti ${zeroSales.length} sales yang memiliki kunjungan tetapi tanpa penjualan`,
    );
  }

  if (actions.length === 0) {
    actions.push("Lanjutkan pemantauan tren performa");
  }

  return {
    date: metrics.date,
    highlights,
    risks,
    actions,
    notes: `Ringkasan otomatis. ${redFlags.length} sales memiliki pola yang ditandai.`,
  };
}
