import { NextRequest, NextResponse } from "next/server";
import { getDatesBetween } from "@/lib/utils/date";
import { computeDailyMetricsForDate } from "@/lib/analytics/computeDailyMetrics";
import { getAllRedFlagsForDate } from "@/lib/analytics/redFlags";
import {
  generateWeeklyInsight,
  generateWeeklyFallbackInsight,
} from "@/lib/deepseek/client";

function getLast7DaysRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const toStr = to.toISOString().split("T")[0];
  const fromStr = from.toISOString().split("T")[0];
  return { from: fromStr, to: toStr };
}

export async function GET(_request: NextRequest) {
  try {
    const { from, to } = getLast7DaysRange();
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
