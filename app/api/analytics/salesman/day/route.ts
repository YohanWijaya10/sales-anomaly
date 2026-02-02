import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";
import { getDateRange, isValidDateString } from "@/lib/utils/date";

const QuerySchema = z.object({
  salesman_id: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
      message: "Format sales ID tidak valid",
    }),
  date: z.string().refine(isValidDateString, {
    message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
  }),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const salesman_id = searchParams.get("salesman_id");
    const date = searchParams.get("date");

    const validation = QuerySchema.safeParse({ salesman_id, date });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { salesman_id: salesmanId, date: targetDate } = validation.data;
    const { startOfDay, endOfDay } = getDateRange(targetDate);
    const sql = getDb();

    const salesmanResult = await sql`
      SELECT id, code, name
      FROM salesmen
      WHERE id = ${salesmanId}
      LIMIT 1
    `;

    if (!salesmanResult || salesmanResult.length === 0) {
      return NextResponse.json(
        { error: "Sales tidak ditemukan" },
        { status: 404 }
      );
    }

    const checkins = await sql`
      SELECT
        c.id,
        c.ts,
        c.lat,
        c.lng,
        c.notes,
        o.id as outlet_id,
        o.code as outlet_code,
        o.name as outlet_name
      FROM checkins c
      LEFT JOIN outlets o ON c.outlet_id = o.id
      WHERE c.salesman_id = ${salesmanId}
        AND c.ts >= ${startOfDay}::timestamptz
        AND c.ts <= ${endOfDay}::timestamptz
      ORDER BY c.ts ASC
    `;

    const sales = await sql`
      SELECT
        s.id,
        s.ts,
        s.amount,
        s.qty,
        s.invoice_no,
        o.id as outlet_id,
        o.code as outlet_code,
        o.name as outlet_name
      FROM sales s
      LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.salesman_id = ${salesmanId}
        AND s.ts >= ${startOfDay}::timestamptz
        AND s.ts <= ${endOfDay}::timestamptz
      ORDER BY s.ts ASC
    `;

    const totals = {
      total_checkins: checkins.length,
      total_sales: sales.length,
      total_sales_amount: sales.reduce(
        (sum: number, s: { amount: number }) => sum + Number(s.amount || 0),
        0
      ),
      total_sales_qty: sales.reduce(
        (sum: number, s: { qty: number }) => sum + Number(s.qty || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        salesman: salesmanResult[0],
        totals,
        checkins,
        sales,
      },
    });
  } catch (error) {
    console.error("Error detail harian sales:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
