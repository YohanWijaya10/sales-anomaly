import { NextRequest, NextResponse } from "next/server";
import { getDatesBetween, getLastCompleteWeekRange } from "@/lib/utils/date";
import { computeDailyMetricsForDate } from "@/lib/analytics/computeDailyMetrics";
import { getAllRedFlagsForDate } from "@/lib/analytics/redFlags";
import { getDb } from "@/lib/db/neon";
import {
  generateWeeklyInsight,
  generateWeeklyFallbackInsight,
} from "@/lib/deepseek/client";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

async function getLeaderRegionSummary(
  from: string,
  to: string,
  sql: ReturnType<typeof getDb>
) {
  const startOfRange = `${from}T00:00:00.000Z`;
  const endOfRange = `${to}T23:59:59.999Z`;

  const leaderRows = await sql`
    SELECT
      l.id,
      l.code,
      l.name,
      COALESCE(cv.visit_count, 0) as visit_count,
      COALESCE(sa.total_sales_amount, 0) as total_sales_amount,
      COALESCE(sa.total_sales_qty, 0) as total_sales_qty,
      COALESCE(sa.outlet_with_sales_count, 0) as outlet_with_sales_count
    FROM leaders l
    LEFT JOIN (
      SELECT leader_id,
             COUNT(*) as visit_count
      FROM checkins
      WHERE ts >= ${startOfRange}::timestamptz
        AND ts <= ${endOfRange}::timestamptz
      GROUP BY leader_id
    ) cv ON cv.leader_id = l.id
    LEFT JOIN (
      SELECT leader_id,
             COALESCE(SUM(amount), 0) as total_sales_amount,
             COALESCE(SUM(qty), 0) as total_sales_qty,
             COUNT(DISTINCT outlet_id) FILTER (WHERE amount > 0) as outlet_with_sales_count
      FROM sales
      WHERE ts >= ${startOfRange}::timestamptz
        AND ts <= ${endOfRange}::timestamptz
      GROUP BY leader_id
    ) sa ON sa.leader_id = l.id
  `;

  const regionRows = await sql`
    SELECT
      r.id,
      r.code,
      r.name,
      COALESCE(cv.visit_count, 0) as visit_count,
      COALESCE(sa.total_sales_amount, 0) as total_sales_amount,
      COALESCE(sa.total_sales_qty, 0) as total_sales_qty,
      COALESCE(sa.outlet_with_sales_count, 0) as outlet_with_sales_count
    FROM regions r
    LEFT JOIN (
      SELECT region_id,
             COUNT(*) as visit_count
      FROM checkins
      WHERE ts >= ${startOfRange}::timestamptz
        AND ts <= ${endOfRange}::timestamptz
      GROUP BY region_id
    ) cv ON cv.region_id = r.id
    LEFT JOIN (
      SELECT region_id,
             COALESCE(SUM(amount), 0) as total_sales_amount,
             COALESCE(SUM(qty), 0) as total_sales_qty,
             COUNT(DISTINCT outlet_id) FILTER (WHERE amount > 0) as outlet_with_sales_count
      FROM sales
      WHERE ts >= ${startOfRange}::timestamptz
        AND ts <= ${endOfRange}::timestamptz
      GROUP BY region_id
    ) sa ON sa.region_id = r.id
  `;

  const leaders = leaderRows.map((l: any) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    visit_count: Number(l.visit_count || 0),
    total_sales_amount: Number(l.total_sales_amount || 0),
    total_sales_qty: Number(l.total_sales_qty || 0),
    outlet_with_sales_count: Number(l.outlet_with_sales_count || 0),
    conversion_rate:
      Number(l.visit_count || 0) > 0
        ? Number(l.outlet_with_sales_count || 0) / Number(l.visit_count || 0)
        : 0,
  }));

  const regions = regionRows.map((r: any) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    visit_count: Number(r.visit_count || 0),
    total_sales_amount: Number(r.total_sales_amount || 0),
    total_sales_qty: Number(r.total_sales_qty || 0),
    outlet_with_sales_count: Number(r.outlet_with_sales_count || 0),
    conversion_rate:
      Number(r.visit_count || 0) > 0
        ? Number(r.outlet_with_sales_count || 0) / Number(r.visit_count || 0)
        : 0,
  }));

  return { leaders, regions };
}

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get("refresh") === "1";
    const { from, to } = getLastCompleteWeekRange();
    const prevFrom = shiftDate(from, -7);
    const prevTo = shiftDate(to, -7);
    const sql = getDb();

    const cachedInsight = null;

    const dates = getDatesBetween(from, to);
    const prevDates = getDatesBetween(prevFrom, prevTo);

    const perDay = await Promise.all(
      dates.map(async (date) => {
        const metrics = await computeDailyMetricsForDate(date);
        const redFlags = await getAllRedFlagsForDate(date, metrics.salesmen_metrics);
        return { date, metrics, redFlags };
      })
    );

    const perDayPrev = await Promise.all(
      prevDates.map(async (date) => {
        const metrics = await computeDailyMetricsForDate(date);
        return { date, metrics };
      })
    );

    const issuesMap = new Map<
      string,
      {
        salesman_id: string;
        salesman_code: string;
        salesman_name: string;
        total_flags: number;
        severity_counts: { high: number; medium: number; low: number };
        flags: Map<
          string,
          {
            code: string;
            title: string;
            severity: "high" | "medium" | "low";
            count: number;
            reasons: Set<string>;
          }
        >;
      }
    >();

    const salesmenMap = new Map<
      string,
      { name: string; total_sales_amount: number; total_visits: number; conversion_rates: number[] }
    >();
    let totalVisits = 0;
    let totalSalesAmount = 0;
    let totalSalesQty = 0;
    let totalSalesmen = 0;
    let totalOutletsWithSales = 0;
    const redFlagCounts = { high: 0, medium: 0, low: 0 };

    for (const day of perDay) {
      totalVisits += day.metrics.total_visits;
      totalSalesAmount += day.metrics.total_sales_amount;
      totalSalesQty += day.metrics.total_sales_qty;
      totalSalesmen = Math.max(totalSalesmen, day.metrics.total_salesmen);

      for (const m of day.metrics.salesmen_metrics) {
        totalOutletsWithSales += m.outlet_with_sales_count;

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
        if (!issuesMap.has(sr.salesman_id)) {
          issuesMap.set(sr.salesman_id, {
            salesman_id: sr.salesman_id,
            salesman_code: sr.salesman_code,
            salesman_name: sr.salesman_name,
            total_flags: 0,
            severity_counts: { high: 0, medium: 0, low: 0 },
            flags: new Map(),
          });
        }
        const issueEntry = issuesMap.get(sr.salesman_id)!;

        for (const flag of sr.red_flags) {
          if (flag.severity === "high") redFlagCounts.high++;
          if (flag.severity === "medium") redFlagCounts.medium++;
          if (flag.severity === "low") redFlagCounts.low++;

          issueEntry.total_flags++;
          issueEntry.severity_counts[flag.severity]++;

          if (!issueEntry.flags.has(flag.code)) {
            issueEntry.flags.set(flag.code, {
              code: flag.code,
              title: flag.title,
              severity: flag.severity,
              count: 0,
              reasons: new Set<string>(),
            });
          }
          const flagEntry = issueEntry.flags.get(flag.code)!;
          flagEntry.count++;
          if (flag.reason) {
            flagEntry.reasons.add(flag.reason);
          }
        }
      }
    }

    let prevTotalVisits = 0;
    let prevTotalSalesAmount = 0;
    let prevTotalSalesQty = 0;
    let prevTotalSalesmen = 0;
    let prevTotalOutletsWithSales = 0;

    for (const day of perDayPrev) {
      prevTotalVisits += day.metrics.total_visits;
      prevTotalSalesAmount += day.metrics.total_sales_amount;
      prevTotalSalesQty += day.metrics.total_sales_qty;
      prevTotalSalesmen = Math.max(prevTotalSalesmen, day.metrics.total_salesmen);
      for (const m of day.metrics.salesmen_metrics) {
        prevTotalOutletsWithSales += m.outlet_with_sales_count;
      }
    }

    const prevAvgConversionRate =
      prevTotalVisits > 0 ? prevTotalOutletsWithSales / prevTotalVisits : 0;

    const severityWeight = { high: 3, medium: 2, low: 1 };
    const issues = Array.from(issuesMap.values())
      .map((entry) => ({
        salesman_id: entry.salesman_id,
        salesman_code: entry.salesman_code,
        salesman_name: entry.salesman_name,
        total_flags: entry.total_flags,
        severity_counts: entry.severity_counts,
        flags: Array.from(entry.flags.values()).map((f) => ({
          code: f.code,
          title: f.title,
          severity: f.severity,
          count: f.count,
          reasons: Array.from(f.reasons).slice(0, 2),
        })),
      }))
      .sort((a, b) => {
        const aScore =
          a.severity_counts.high * severityWeight.high +
          a.severity_counts.medium * severityWeight.medium +
          a.severity_counts.low * severityWeight.low;
        const bScore =
          b.severity_counts.high * severityWeight.high +
          b.severity_counts.medium * severityWeight.medium +
          b.severity_counts.low * severityWeight.low;
        if (bScore !== aScore) return bScore - aScore;
        return b.total_flags - a.total_flags;
      });

    const avgConversionRate =
      totalVisits > 0 ? totalOutletsWithSales / totalVisits : 0;

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

    const { leaders, regions } = await getLeaderRegionSummary(from, to, sql);
    const { regions: prevRegions } = await getLeaderRegionSummary(prevFrom, prevTo, sql);

    const salesmanDealRows = await sql`
      SELECT
        salesman_id,
        COUNT(DISTINCT outlet_id) FILTER (WHERE amount > 0) as outlet_with_sales_count
      FROM sales
      WHERE ts >= ${`${from}T00:00:00.000Z`}::timestamptz
        AND ts <= ${`${to}T23:59:59.999Z`}::timestamptz
      GROUP BY salesman_id
    `;
    const salesmanDealMap = new Map<string, number>();
    for (const row of salesmanDealRows) {
      salesmanDealMap.set(row.salesman_id, Number(row.outlet_with_sales_count || 0));
    }
    const topLeadersBySales = leaders
      .slice()
      .sort((a, b) => b.total_sales_amount - a.total_sales_amount)
      .slice(0, 2)
      .map((l) => ({ name: l.name, amount: l.total_sales_amount }));

    const topSalesmanBySales = topBySales[0]
      ? { name: topBySales[0].name, amount: topBySales[0].amount }
      : null;

    const topRegionByVisits = regions
      .slice()
      .sort((a, b) => b.visit_count - a.visit_count)[0] || null;

    const lowConversionRegionCandidate =
      regions
        .filter((r) => r.visit_count > 0)
        .slice()
        .sort((a, b) => a.conversion_rate - b.conversion_rate)[0] || null;

    const lowConversionRegion =
      lowConversionRegionCandidate &&
      lowConversionRegionCandidate.conversion_rate < 0.4
        ? lowConversionRegionCandidate
        : null;

    const poorPerformers = issues
      .map((issue) => {
        const totals = salesmenMap.get(issue.salesman_id);
        const totalVisits = totals?.total_visits ?? 0;
        const totalSalesAmount = totals?.total_sales_amount ?? 0;
        const outletWithSalesCount = salesmanDealMap.get(issue.salesman_id) ?? 0;
        const conversionRate = totalVisits > 0 ? outletWithSalesCount / totalVisits : 0;
        return {
          name: issue.salesman_name,
          count: issue.total_flags,
          visit_count_week: totalVisits,
          total_sales_amount: totalSalesAmount,
          conversion_rate: conversionRate,
          outlet_with_sales_count: outletWithSalesCount,
        };
      })
      .filter(
        (p) =>
          p.visit_count_week > 0 &&
          (p.total_sales_amount === 0 || p.conversion_rate < 0.3)
      )
      .slice(0, 3);

    const salesPerformance = Array.from(salesmenMap.entries()).map(([salesmanId, s]) => ({
      salesman_id: salesmanId,
      name: s.name,
      visit_count_week: s.total_visits,
      total_sales_amount: s.total_sales_amount,
      outlet_with_sales_count: salesmanDealMap.get(salesmanId) ?? 0,
    }));

    const input = {
      period: { from, to },
      totals: {
        total_visits: totalVisits,
        total_sales_amount: totalSalesAmount,
        total_sales_qty: totalSalesQty,
        avg_conversion_rate: avgConversionRate,
        total_salesmen: totalSalesmen,
      },
      prev_totals: {
        total_visits: prevTotalVisits,
        total_sales_amount: prevTotalSalesAmount,
        total_sales_qty: prevTotalSalesQty,
        avg_conversion_rate: prevAvgConversionRate,
        total_salesmen: prevTotalSalesmen,
        period: { from: prevFrom, to: prevTo },
      },
      topBySales,
      topByConversion,
      topLeadersBySales,
      topSalesmanBySales,
      topRegionByVisits,
      lowConversionRegion: lowConversionRegion
        ? {
            name: lowConversionRegion.name,
            visit_count: lowConversionRegion.visit_count,
            outlet_with_sales_count: lowConversionRegion.outlet_with_sales_count,
            conversion_rate: lowConversionRegion.conversion_rate,
          }
        : null,
      poorPerformers,
      salesPerformance,
      regions,
      prev_regions: prevRegions,
      redFlagCounts,
    };

    let insight;
    let fromLLM = false;
    let cachedHit = false;
    if (cachedInsight) {
      insight = cachedInsight;
      cachedHit = true;
    } else if (process.env.DEEPSEEK_API_KEY) {
      insight = await generateWeeklyInsight(input);
      fromLLM = true;
    } else {
      insight = generateWeeklyFallbackInsight(input);
    }

    // cache disabled temporarily for consistency with live data

    return NextResponse.json({
      success: true,
      cached: cachedHit,
      from_llm: fromLLM,
      data: insight,
      meta: {
        period: { from, to },
        totals: input.totals,
        red_flags: redFlagCounts,
        issues,
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
