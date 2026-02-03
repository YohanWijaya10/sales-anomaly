import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  computeDailyMetricsForDate,
  computeMetricsForRange,
} from "@/lib/analytics/computeDailyMetrics";
import { getAllRedFlagsForDate } from "@/lib/analytics/redFlags";
import {
  getMonthRangeForDate,
  getWeekRangeForDate,
  isValidDateString,
} from "@/lib/utils/date";

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

    const metrics =
      validation.data.mode === "daily"
        ? await computeDailyMetricsForDate(validation.data.date)
        : await computeMetricsForRange(period.from, period.to);

    const redFlags =
      validation.data.mode === "daily"
        ? await getAllRedFlagsForDate(
            validation.data.date,
            metrics.salesmen_metrics
          )
        : [];

    // Compute rankings
    const sortedByConversion = [...metrics.salesmen_metrics]
      .filter((m) => m.visit_count > 0)
      .sort((a, b) => b.conversion_rate - a.conversion_rate);

    const sortedBySales = [...metrics.salesmen_metrics]
      .sort((a, b) => b.total_sales_amount - a.total_sales_amount);

    const sortedByVisits = [...metrics.salesmen_metrics]
      .sort((a, b) => b.visit_count - a.visit_count);

    const rankings = {
      top_by_conversion: sortedByConversion.slice(0, 3).map((m) => ({
        salesman_id: m.salesman_id,
        salesman_name: m.salesman_name,
        conversion_rate: m.conversion_rate,
      })),
      bottom_by_conversion: sortedByConversion.slice(-3).reverse().map((m) => ({
        salesman_id: m.salesman_id,
        salesman_name: m.salesman_name,
        conversion_rate: m.conversion_rate,
      })),
      top_by_sales: sortedBySales.slice(0, 3).map((m) => ({
        salesman_id: m.salesman_id,
        salesman_name: m.salesman_name,
        total_sales_amount: m.total_sales_amount,
      })),
      bottom_by_sales: sortedBySales.slice(-3).reverse().map((m) => ({
        salesman_id: m.salesman_id,
        salesman_name: m.salesman_name,
        total_sales_amount: m.total_sales_amount,
      })),
      top_by_visits: sortedByVisits.slice(0, 3).map((m) => ({
        salesman_id: m.salesman_id,
        salesman_name: m.salesman_name,
        visit_count: m.visit_count,
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        red_flags: redFlags,
        rankings,
        period,
      },
    });
  } catch (error) {
    console.error("Error analitik harian:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
