import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";
import {
  getDateRange,
  getLastCompleteWeekRange,
  isValidDateString,
} from "@/lib/utils/date";

const QuerySchema = z.object({
  date: z
    .string()
    .optional()
    .refine((val) => (val ? isValidDateString(val) : true), {
      message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
    }),
  range: z.enum(["7d", "30d"]).optional(),
  from: z
    .string()
    .optional()
    .refine((val) => (val ? isValidDateString(val) : true), {
      message: "Format tanggal from tidak valid. Gunakan YYYY-MM-DD",
    }),
  to: z
    .string()
    .optional()
    .refine((val) => (val ? isValidDateString(val) : true), {
      message: "Format tanggal to tidak valid. Gunakan YYYY-MM-DD",
    }),
});


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") ?? undefined;
    const range = searchParams.get("range") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const validation = QuerySchema.safeParse({ date, range, from, to });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    let startOfDay: string;
    let endOfDay: string;
    let period: { from: string; to: string } | null = null;

    if (validation.data.from || validation.data.to) {
      if (!validation.data.from || !validation.data.to) {
        return NextResponse.json(
          { error: "Parameter from dan to harus diisi bersamaan" },
          { status: 400 }
        );
      }
      period = { from: validation.data.from, to: validation.data.to };
      startOfDay = `${period.from}T00:00:00.000Z`;
      endOfDay = `${period.to}T23:59:59.999Z`;
    } else if (validation.data.range) {
      const weekRange = getLastCompleteWeekRange();
      if (validation.data.range === "30d") {
        // 30 hari: 4 minggu lengkap berakhir di akhir minggu terakhir
        const endDate = new Date(`${weekRange.to}T00:00:00.000Z`);
        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - 27); // 28 hari = 4 minggu
        period = {
          from: startDate.toISOString().split("T")[0],
          to: weekRange.to,
        };
      } else {
        period = weekRange;
      }
      startOfDay = `${period.from}T00:00:00.000Z`;
      endOfDay = `${period.to}T23:59:59.999Z`;
    } else if (validation.data.date) {
      const rangeForDate = getDateRange(validation.data.date);
      startOfDay = rangeForDate.startOfDay;
      endOfDay = rangeForDate.endOfDay;
    } else {
      period = getLastCompleteWeekRange();
      startOfDay = `${period.from}T00:00:00.000Z`;
      endOfDay = `${period.to}T23:59:59.999Z`;
    }
    const sql = getDb();

    const leaderRows = await sql`
      SELECT
        l.id,
        l.code,
        l.name,
        COALESCE(cv.visit_count, 0) as visit_count,
        COALESCE(cv.unique_outlet_count, 0) as unique_outlet_count,
        COALESCE(sa.total_sales_amount, 0) as total_sales_amount,
        COALESCE(sa.total_sales_qty, 0) as total_sales_qty,
        COALESCE(sa.outlet_with_sales_count, 0) as outlet_with_sales_count
      FROM leaders l
      LEFT JOIN (
        SELECT leader_id,
               COUNT(*) as visit_count,
               COUNT(DISTINCT outlet_id) as unique_outlet_count
        FROM checkins
        WHERE ts >= ${startOfDay}::timestamptz
          AND ts <= ${endOfDay}::timestamptz
        GROUP BY leader_id
      ) cv ON cv.leader_id = l.id
      LEFT JOIN (
        SELECT leader_id,
               COALESCE(SUM(amount), 0) as total_sales_amount,
               COALESCE(SUM(qty), 0) as total_sales_qty,
               COUNT(DISTINCT outlet_id) FILTER (WHERE amount > 0) as outlet_with_sales_count
        FROM sales
        WHERE ts >= ${startOfDay}::timestamptz
          AND ts <= ${endOfDay}::timestamptz
        GROUP BY leader_id
      ) sa ON sa.leader_id = l.id
      ORDER BY total_sales_amount DESC, visit_count DESC
    `;

    const regionRows = await sql`
      SELECT
        r.id,
        r.code,
        r.name,
        r.leader_id,
        COALESCE(cv.visit_count, 0) as visit_count,
        COALESCE(cv.unique_outlet_count, 0) as unique_outlet_count,
        COALESCE(sa.total_sales_amount, 0) as total_sales_amount,
        COALESCE(sa.total_sales_qty, 0) as total_sales_qty,
        COALESCE(sa.outlet_with_sales_count, 0) as outlet_with_sales_count
      FROM regions r
      LEFT JOIN (
        SELECT region_id,
               COUNT(*) as visit_count,
               COUNT(DISTINCT outlet_id) as unique_outlet_count
        FROM checkins
        WHERE ts >= ${startOfDay}::timestamptz
          AND ts <= ${endOfDay}::timestamptz
        GROUP BY region_id
      ) cv ON cv.region_id = r.id
      LEFT JOIN (
        SELECT region_id,
               COALESCE(SUM(amount), 0) as total_sales_amount,
               COALESCE(SUM(qty), 0) as total_sales_qty,
               COUNT(DISTINCT outlet_id) FILTER (WHERE amount > 0) as outlet_with_sales_count
        FROM sales
        WHERE ts >= ${startOfDay}::timestamptz
          AND ts <= ${endOfDay}::timestamptz
        GROUP BY region_id
      ) sa ON sa.region_id = r.id
      ORDER BY total_sales_amount DESC, visit_count DESC
    `;

    const leaders = leaderRows.map((l: any) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      visit_count: Number(l.visit_count || 0),
      unique_outlet_count: Number(l.unique_outlet_count || 0),
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
      leader_id: r.leader_id,
      visit_count: Number(r.visit_count || 0),
      unique_outlet_count: Number(r.unique_outlet_count || 0),
      total_sales_amount: Number(r.total_sales_amount || 0),
      total_sales_qty: Number(r.total_sales_qty || 0),
      outlet_with_sales_count: Number(r.outlet_with_sales_count || 0),
      conversion_rate:
        Number(r.visit_count || 0) > 0
          ? Number(r.outlet_with_sales_count || 0) / Number(r.visit_count || 0)
          : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        date: validation.data.date ?? null,
        period,
        leaders,
        regions,
      },
    });
  } catch (error) {
    console.error("Error analitik leader/region:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
