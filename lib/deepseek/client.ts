import { AggregatedMetrics } from "@/lib/analytics/computeDailyMetrics";
import { SalesmanRedFlags, countRedFlagsBySeverity } from "@/lib/analytics/redFlags";
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
  timeout: number
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
        TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
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
  redFlags: SalesmanRedFlags[]
): string {
  const flagCounts = countRedFlagsBySeverity(redFlags);

  // Find top performers
  const sortedByConversion = [...metrics.salesmen_metrics]
    .filter((m) => m.visit_count > 0)
    .sort((a, b) => b.conversion_rate - a.conversion_rate);

  const sortedBySales = [...metrics.salesmen_metrics]
    .sort((a, b) => b.total_sales_amount - a.total_sales_amount);

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
  redFlags: SalesmanRedFlags[]
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

export function generateFallbackInsight(
  metrics: AggregatedMetrics,
  redFlags: SalesmanRedFlags[]
): DailyInsight {
  const flagCounts = countRedFlagsBySeverity(redFlags);

  const highlights: string[] = [];
  const risks: string[] = [];
  const actions: string[] = [];

  // Generate highlights
  if (metrics.total_visits > 0) {
    highlights.push(
      `Total ${metrics.total_visits} kunjungan tercatat oleh ${metrics.total_salesmen} sales`
    );
  }

  if (metrics.total_sales_amount > 0) {
    highlights.push(
      `Total penjualan sebesar ${formatCurrency(metrics.total_sales_amount)} (${metrics.total_sales_qty} unit)`
    );
  }

  if (metrics.avg_conversion_rate > 0.5) {
    highlights.push(
      `Rata-rata konversi ${formatPercentage(metrics.avg_conversion_rate)} melebihi 50%`
    );
  }

  if (highlights.length === 0) {
    highlights.push("Tidak ada aktivitas signifikan pada tanggal ini");
  }

  // Generate risks
  if (flagCounts.high > 0) {
    risks.push(
      `${flagCounts.high} pola dengan tingkat tinggi terdeteksi dan perlu ditinjau segera`
    );
  }

  if (flagCounts.medium > 0) {
    risks.push(`${flagCounts.medium} pola tingkat sedang perlu perhatian`);
  }

  if (metrics.avg_conversion_rate < 0.3 && metrics.total_visits > 0) {
    risks.push(
      `Rata-rata konversi rendah: ${formatPercentage(metrics.avg_conversion_rate)}`
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
    actions.push("Investigasi outlet dengan konversi rendah dan berikan pelatihan sales");
  }

  const zeroSales = metrics.salesmen_metrics.filter(
    (m) => m.visit_count > 0 && m.total_sales_amount === 0
  );
  if (zeroSales.length > 0) {
    actions.push(
      `Tindak lanjuti ${zeroSales.length} sales yang memiliki kunjungan tetapi tanpa penjualan`
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
