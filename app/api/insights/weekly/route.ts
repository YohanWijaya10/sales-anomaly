import { NextRequest, NextResponse } from "next/server";
import { getDatesBetween } from "@/lib/utils/date";
import { computeDailyMetricsForDate } from "@/lib/analytics/computeDailyMetrics";
import { getAllRedFlagsForDate } from "@/lib/analytics/redFlags";
import { getDb } from "@/lib/db/neon";
import {
  generateWeeklyInsight,
  generateWeeklyFallbackInsight,
} from "@/lib/deepseek/client";

function getLastCompleteWeekRange(): { from: string; to: string } {
  const today = new Date();
  const utcDay = today.getUTCDay(); // 0 = Sunday
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // Use last complete week (Mon-Sun). If today is Sunday, current week is complete.
  if (utcDay !== 0) {
    end.setUTCDate(end.getUTCDate() - utcDay);
  }

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  const toStr = end.toISOString().split("T")[0];
  const fromStr = start.toISOString().split("T")[0];
  return { from: fromStr, to: toStr };
}

export async function GET(_request: NextRequest) {
  try {
    const { from, to } = getLastCompleteWeekRange();
    const sql = getDb();

    const cached = await sql`
      SELECT payload_json FROM weekly_insights_cache
      WHERE period_from = ${from} AND period_to = ${to}
      LIMIT 1
    `;

    if (cached.length > 0 && cached[0].payload_json) {
      return NextResponse.json({
        success: true,
        cached: true,
        from_llm: false,
        data: cached[0].payload_json,
        meta: { period: { from, to } },
      });
    }

    const dates = getDatesBetween(from, to);

    const perDay = await Promise.all(
      dates.map(async (date) => {
        const metrics = await computeDailyMetricsForDate(date);
        const redFlags = await getAllRedFlagsForDate(date, metrics.salesmen_metrics);
        return { date, metrics, redFlags };
      })
    );

    const salesmenMap = new Map<
      string,
      { name: string; total_sales_amount: number; total_visits: number; conversion_rates: number[] }
    >();
    let totalVisits = 0;
    let totalSalesAmount = 0;
    let totalSalesQty = 0;
    let totalSalesmen = 0;
    let conversionRateSum = 0;
    let conversionRateCount = 0;
    const redFlagCounts = { high: 0, medium: 0, low: 0 };

    for (const day of perDay) {
      totalVisits += day.metrics.total_visits;
      totalSalesAmount += day.metrics.total_sales_amount;
      totalSalesQty += day.metrics.total_sales_qty;
      totalSalesmen = Math.max(totalSalesmen, day.metrics.total_salesmen);

      for (const m of day.metrics.salesmen_metrics) {
        if (!salesmenMap.has(m.salesman_id)) {
          salesmenMap.set(m.salesman_id, {
            name: m.salesman_name,
            total_sales_amount: 0,
            total_visits: 0,
            conversion_rates: [],
          });
        }
        const entry = salesmenMap.get(m.salesman_id)!;
        entry.total_sales_amount += m.total_sales_amount;
        entry.total_visits += m.visit_count;
        if (m.visit_count > 0) {
          entry.conversion_rates.push(m.conversion_rate);
        }
      }

      for (const sr of day.redFlags) {
        for (const flag of sr.red_flags) {
          if (flag.severity === "high") redFlagCounts.high++;
          if (flag.severity === "medium") redFlagCounts.medium++;
          if (flag.severity === "low") redFlagCounts.low++;
        }
      }
    }

    for (const entry of salesmenMap.values()) {
      if (entry.conversion_rates.length > 0) {
        const avg =
          entry.conversion_rates.reduce((sum, v) => sum + v, 0) /
          entry.conversion_rates.length;
        conversionRateSum += avg;
        conversionRateCount++;
      }
    }

    const avgConversionRate =
      conversionRateCount > 0 ? conversionRateSum / conversionRateCount : 0;

    const salesmenArray = Array.from(salesmenMap.values());
    const topBySales = salesmenArray
      .slice()
      .sort((a, b) => b.total_sales_amount - a.total_sales_amount)
      .slice(0, 3)
      .map((s) => ({ name: s.name, amount: s.total_sales_amount }));

    const topByConversion = salesmenArray
      .map((s) => ({
        name: s.name,
        rate:
          s.conversion_rates.length > 0
            ? s.conversion_rates.reduce((sum, v) => sum + v, 0) / s.conversion_rates.length
            : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);

    const input = {
      period: { from, to },
      totals: {
        total_visits: totalVisits,
        total_sales_amount: totalSalesAmount,
        total_sales_qty: totalSalesQty,
        avg_conversion_rate: avgConversionRate,
        total_salesmen: totalSalesmen,
      },
      topBySales,
      topByConversion,
      redFlagCounts,
    };

    let insight;
    let fromLLM = false;
    if (process.env.DEEPSEEK_API_KEY) {
      insight = await generateWeeklyInsight(input);
      fromLLM = true;
    } else {
      insight = generateWeeklyFallbackInsight(input);
    }

    try {
      await sql`
        INSERT INTO weekly_insights_cache (period_from, period_to, payload_json)
        VALUES (${from}, ${to}, ${JSON.stringify(insight)})
        ON CONFLICT (period_from, period_to)
        DO UPDATE SET payload_json = ${JSON.stringify(insight)}
      `;
    } catch (cacheError) {
      console.error("Gagal menyimpan cache weekly insight:", cacheError);
    }

    return NextResponse.json({
      success: true,
      from_llm: fromLLM,
      data: insight,
      meta: {
        period: { from, to },
        totals: input.totals,
        red_flags: redFlagCounts,
      },
    });
  } catch (error) {
    console.error("Error insight mingguan:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
