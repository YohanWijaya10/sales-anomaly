import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";
import {
  getBusinessTzOffsetMinutes,
  getDatesBetween,
  getMonthRangeForDate,
  getRangeTimestamps,
  getWeekRangeForDate,
  isValidDateString,
} from "@/lib/utils/date";
import {
  computeDailyMetricsForDate,
  computeMetricsForRange,
} from "@/lib/analytics/computeDailyMetrics";
import { generateSalesPerformanceInsights } from "@/lib/deepseek/client";

const QuerySchema = z.object({
  date: z.string().refine(isValidDateString, {
    message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
  }),
  mode: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const mode = searchParams.get("mode") ?? "daily";

    const validation = QuerySchema.safeParse({ date, mode });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    const period =
      validation.data.mode === "weekly"
        ? getWeekRangeForDate(validation.data.date)
        : validation.data.mode === "monthly"
        ? getMonthRangeForDate(validation.data.date)
        : { from: validation.data.date, to: validation.data.date };

    const daysCount = getDatesBetween(period.from, period.to).length;
    const { startOfRange, endOfRange } = getRangeTimestamps(period.from, period.to);
    const sql = getDb();

    const metrics =
      validation.data.mode === "daily"
        ? await computeDailyMetricsForDate(validation.data.date)
        : await computeMetricsForRange(period.from, period.to);

    const topByConversion = [...metrics.salesmen_metrics]
      .filter((m) => m.visit_count > 0)
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 5)
      .map((m) => ({
        name: m.salesman_name,
        conversion_rate: m.conversion_rate,
        visits: m.visit_count,
      }));

    const topBySales = [...metrics.salesmen_metrics]
      .sort((a, b) => b.total_sales_amount - a.total_sales_amount)
      .slice(0, 5)
      .map((m) => ({ name: m.salesman_name, total_sales_amount: m.total_sales_amount }));

    const outletTypeRows = await sql`
      SELECT
        s.name as salesman_name,
        COALESCE(
          to_jsonb(o)->>'outlet_type',
          to_jsonb(o)->>'type',
          to_jsonb(o)->>'category',
          to_jsonb(o)->>'segment',
          to_jsonb(o)->>'channel'
        ) as outlet_type,
        COUNT(*) as visit_count
      FROM checkins c
      JOIN salesmen s ON s.id = c.salesman_id
      LEFT JOIN outlets o ON o.id = c.outlet_id
      WHERE c.ts >= ${startOfRange}::timestamptz
        AND c.ts <= ${endOfRange}::timestamptz
      GROUP BY s.name, outlet_type
    `;

    const outletTypeMap = new Map<
      string,
      { total: number; items: Array<{ outlet_type: string; visit_count: number }> }
    >();
    for (const row of outletTypeRows) {
      const outletType = (row.outlet_type || "").trim();
      if (!outletType) continue;
      if (!outletTypeMap.has(row.salesman_name)) {
        outletTypeMap.set(row.salesman_name, { total: 0, items: [] });
      }
      const entry = outletTypeMap.get(row.salesman_name)!;
      const count = Number(row.visit_count || 0);
      entry.total += count;
      entry.items.push({ outlet_type: outletType, visit_count: count });
    }

    const outletTypeShare = Array.from(outletTypeMap.entries())
      .flatMap(([salesman_name, data]) =>
        data.items.map((item) => ({
          salesman_name,
          outlet_type: item.outlet_type,
          visit_count: item.visit_count,
          share: data.total > 0 ? item.visit_count / data.total : 0,
        }))
      )
      .sort((a, b) => b.share - a.share)
      .slice(0, 10);

    const offsetMinutes = getBusinessTzOffsetMinutes();
    const timeRows = await sql`
      WITH checkins_base AS (
        SELECT
          c.salesman_id,
          s.name as salesman_name,
          c.outlet_id,
          c.ts,
          EXTRACT(HOUR FROM (c.ts + make_interval(mins => ${offsetMinutes}))) as local_hour,
          DATE(c.ts + make_interval(mins => ${offsetMinutes})) as local_date
        FROM checkins c
        JOIN salesmen s ON s.id = c.salesman_id
        WHERE c.ts >= ${startOfRange}::timestamptz
          AND c.ts <= ${endOfRange}::timestamptz
      )
      SELECT
        cb.salesman_name,
        CASE
          WHEN cb.local_hour BETWEEN 6 AND 11 THEN 'Pagi'
          WHEN cb.local_hour BETWEEN 12 AND 17 THEN 'Siang'
          WHEN cb.local_hour BETWEEN 18 AND 21 THEN 'Malam'
          ELSE 'Larut'
        END as daypart,
        COUNT(*) as visit_count,
        SUM(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM sales s
              WHERE s.salesman_id = cb.salesman_id
                AND s.outlet_id = cb.outlet_id
                AND DATE(s.ts + make_interval(mins => ${offsetMinutes})) = cb.local_date
                AND s.ts >= ${startOfRange}::timestamptz
                AND s.ts <= ${endOfRange}::timestamptz
            ) THEN 1 ELSE 0
          END
        ) as success_count
      FROM checkins_base cb
      GROUP BY cb.salesman_name, daypart
    `;

    const timeOfDay = timeRows
      .map((row: any) => ({
        salesman_name: row.salesman_name,
        daypart: row.daypart,
        visit_count: Number(row.visit_count || 0),
        success_rate:
          Number(row.visit_count || 0) > 0
            ? Number(row.success_count || 0) / Number(row.visit_count || 0)
            : 0,
      }))
      .filter((row: any) => row.visit_count > 0)
      .sort((a: any, b: any) => b.visit_count - a.visit_count)
      .slice(0, 15);

    const bins = [
      { label: "0-2", min: 0, max: 2 },
      { label: "3-5", min: 3, max: 5 },
      { label: "6-8", min: 6, max: 8 },
      { label: "9+", min: 9, max: Infinity },
    ];
    const binAgg = bins.map((b) => ({
      label: b.label,
      salesmen_count: 0,
      total_visits: 0,
      total_outlets_with_sales: 0,
    }));

    for (const m of metrics.salesmen_metrics) {
      const avgVisits = daysCount > 0 ? m.visit_count / daysCount : 0;
      const bin = binAgg.find((b) =>
        b.label === "9+"
          ? avgVisits >= 9
          : avgVisits >= Number(b.label.split("-")[0]) &&
            avgVisits <= Number(b.label.split("-")[1])
      );
      if (!bin) continue;
      bin.salesmen_count += 1;
      bin.total_visits += m.visit_count;
      bin.total_outlets_with_sales += m.outlet_with_sales_count;
    }

    const visitPerDayBins = binAgg.map((b) => ({
      label: b.label,
      salesmen_count: b.salesmen_count,
      conversion_rate: b.total_visits > 0 ? b.total_outlets_with_sales / b.total_visits : 0,
    }));

    const insightInput = {
      period,
      totals: {
        total_visits: metrics.total_visits,
        total_sales_amount: metrics.total_sales_amount,
        total_sales_qty: metrics.total_sales_qty,
      },
      topByConversion,
      topBySales,
      outletTypeShare,
      timeOfDay,
      visitPerDayBins,
    };

    const insights = process.env.DEEPSEEK_API_KEY
      ? await generateSalesPerformanceInsights(insightInput)
      : { period, insights: ["DEEPSEEK_API_KEY belum terpasang."] };

    return NextResponse.json({
      success: true,
      data: insights,
      meta: {
        period,
        totals: insightInput.totals,
        top_by_conversion: topByConversion,
      },
    });
  } catch (error) {
    console.error("Error sales performance insights:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
