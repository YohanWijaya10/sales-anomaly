import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";
import { getDateRange, isValidDateString } from "@/lib/utils/date";

const QuerySchema = z.object({
  date: z.string().refine(isValidDateString, {
    message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
  }),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const validation = QuerySchema.safeParse({ date });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { startOfDay, endOfDay } = getDateRange(validation.data.date);
    const sql = getDb();

    const rows = await sql`
      SELECT
        o.id,
        o.code,
        o.name,
        COALESCE(cv.visit_count, 0) as visit_count,
        COALESCE(sa.total_sales_amount, 0) as total_sales_amount,
        COALESCE(sa.total_sales_qty, 0) as total_sales_qty,
        COALESCE(sa.sales_count, 0) as sales_count
      FROM outlets o
      LEFT JOIN (
        SELECT outlet_id, COUNT(*) as visit_count
        FROM checkins
        WHERE ts >= ${startOfDay}::timestamptz
          AND ts <= ${endOfDay}::timestamptz
        GROUP BY outlet_id
      ) cv ON cv.outlet_id = o.id
      LEFT JOIN (
        SELECT outlet_id,
               COALESCE(SUM(amount), 0) as total_sales_amount,
               COALESCE(SUM(qty), 0) as total_sales_qty,
               COUNT(*) as sales_count
        FROM sales
        WHERE ts >= ${startOfDay}::timestamptz
          AND ts <= ${endOfDay}::timestamptz
        GROUP BY outlet_id
      ) sa ON sa.outlet_id = o.id
      ORDER BY total_sales_amount DESC, visit_count DESC
    `;

    const outlets = rows.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      visit_count: Number(r.visit_count || 0),
      sales_count: Number(r.sales_count || 0),
      total_sales_amount: Number(r.total_sales_amount || 0),
      total_sales_qty: Number(r.total_sales_qty || 0),
    }));

    return NextResponse.json({
      success: true,
      data: { date: validation.data.date, outlets },
    });
  } catch (error) {
    console.error("Error analitik outlet:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
