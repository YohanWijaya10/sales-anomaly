import { getDb } from "@/lib/db/neon";
import { getDateRange, getDaysAgo } from "@/lib/utils/date";
import { SalesmanMetrics } from "./computeDailyMetrics";

export type RedFlagSeverity = "low" | "medium" | "high";

export interface RedFlag {
  code: string;
  title: string;
  severity: RedFlagSeverity;
  reason: string;
}

export interface SalesmanRedFlags {
  salesman_id: string;
  salesman_code: string;
  salesman_name: string;
  red_flags: RedFlag[];
}

export function detectRedFlagsForMetrics(metrics: SalesmanMetrics): RedFlag[] {
  const flags: RedFlag[] = [];

  // RF_LOW_EFFECTIVENESS: visit_count >= 5 AND total_sales_amount = 0
  if (metrics.visit_count >= 5 && metrics.total_sales_amount === 0) {
    flags.push({
      code: "RF_LOW_EFFECTIVENESS",
      title: "Efektivitas Rendah",
      severity: "high",
      reason: `Melakukan ${metrics.visit_count} kunjungan tetapi tidak ada penjualan. Pola ini perlu ditinjau.`,
    });
  }

  return flags;
}

export async function detectTooConsistentFlag(
  salesmanId: string,
  currentDate: string
): Promise<RedFlag | null> {
  const sql = getDb();

  // Get visit counts for the last 7 days
  const visitCounts: number[] = [];

  for (let i = 0; i < 7; i++) {
    const date = getDaysAgo(i);
    const { startOfDay, endOfDay } = getDateRange(date);

    // Only include dates up to and including the current date
    if (date > currentDate) continue;

    const result = await sql`
      SELECT COUNT(*) as count FROM checkins
      WHERE salesman_id = ${salesmanId}
        AND ts >= ${startOfDay}::timestamptz
        AND ts <= ${endOfDay}::timestamptz
    `;

    if (result && result[0]) {
      visitCounts.push(Number(result[0].count));
    }
  }

  // RF_TOO_CONSISTENT_7D: last 7 days visit_count identical each day AND >= 5
  if (visitCounts.length >= 7) {
    const firstCount = visitCounts[0];
    const allSame = visitCounts.every((c) => c === firstCount);

    if (allSame && firstCount >= 5) {
      return {
        code: "RF_TOO_CONSISTENT_7D",
        title: "Kunjungan Tidak Variatif",
        severity: "medium",
        reason: `Tepat ${firstCount} kunjungan setiap hari selama 7 hari terakhir. Pola kunjungan tidak variatif dan perlu ditinjau.`,
      };
    }
  }

  return null;
}

export async function getAllRedFlagsForDate(
  date: string,
  salesmenMetrics: SalesmanMetrics[]
): Promise<SalesmanRedFlags[]> {
  const results: SalesmanRedFlags[] = [];

  for (const metrics of salesmenMetrics) {
    const dailyFlags = detectRedFlagsForMetrics(metrics);
    const consistentFlag = await detectTooConsistentFlag(
      metrics.salesman_id,
      date
    );

    const allFlags = consistentFlag
      ? [...dailyFlags, consistentFlag]
      : dailyFlags;

    if (allFlags.length > 0) {
      results.push({
        salesman_id: metrics.salesman_id,
        salesman_code: metrics.salesman_code,
        salesman_name: metrics.salesman_name,
        red_flags: allFlags,
      });
    }
  }

  return results;
}

export function countRedFlagsBySeverity(
  redFlags: SalesmanRedFlags[]
): { high: number; medium: number; low: number } {
  const counts = { high: 0, medium: 0, low: 0 };

  for (const sr of redFlags) {
    for (const flag of sr.red_flags) {
      counts[flag.severity]++;
    }
  }

  return counts;
}
