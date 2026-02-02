import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeMetricsForSalesman } from "@/lib/analytics/computeDailyMetrics";
import { detectRedFlagsForMetrics, detectTooConsistentFlag } from "@/lib/analytics/redFlags";
import { isValidDateString } from "@/lib/utils/date";

const QuerySchema = z.object({
  salesman_id: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
      message: "Format sales ID tidak valid",
    }),
  from: z.string().refine(isValidDateString, {
    message: "Format tanggal mulai tidak valid. Gunakan YYYY-MM-DD",
  }),
  to: z.string().refine(isValidDateString, {
    message: "Format tanggal akhir tidak valid. Gunakan YYYY-MM-DD",
  }),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const salesman_id = searchParams.get("salesman_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const validation = QuerySchema.safeParse({ salesman_id, from, to });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { salesman_id: salesmanId, from: fromDate, to: toDate } = validation.data;

    const result = await computeMetricsForSalesman(salesmanId, fromDate, toDate);

    if (!result.salesman) {
      return NextResponse.json(
        { error: "Sales tidak ditemukan" },
        { status: 404 }
      );
    }

    // Compute red flags for each day
    const dailyRedFlags = await Promise.all(
      result.daily_metrics.map(async (metrics) => {
        const dailyFlags = detectRedFlagsForMetrics(metrics);
        const consistentFlag = await detectTooConsistentFlag(
          salesmanId,
          metrics.date
        );
        return {
          date: metrics.date,
          flags: consistentFlag ? [...dailyFlags, consistentFlag] : dailyFlags,
        };
      })
    );

    // Filter to only days with flags
    const redFlagHistory = dailyRedFlags.filter((d) => d.flags.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        salesman: result.salesman,
        daily_metrics: result.daily_metrics,
        totals: result.totals,
        red_flag_history: redFlagHistory,
      },
    });
  } catch (error) {
    console.error("Error analitik sales:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
