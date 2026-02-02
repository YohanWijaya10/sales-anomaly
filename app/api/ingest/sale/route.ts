import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";

const SaleSchema = z.object({
  salesman_code: z.string().min(1),
  salesman_name: z.string().min(1).optional(),
  outlet_code: z.string().min(1),
  outlet_name: z.string().min(1).optional(),
  ts: z.string().datetime(),
  amount: z.number().min(0),
  qty: z.number().min(0),
  invoice_no: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Body request tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const sql = getDb();

    // Upsert salesman
    let salesmanId: string;
    const existingSalesman = await sql`
      SELECT id FROM salesmen WHERE code = ${data.salesman_code} LIMIT 1
    `;

    if (existingSalesman.length > 0) {
      salesmanId = existingSalesman[0].id;
    } else {
      if (!data.salesman_name) {
        return NextResponse.json(
          { error: "salesman_name wajib diisi untuk sales baru" },
          { status: 400 }
        );
      }

      const newSalesman = await sql`
        INSERT INTO salesmen (code, name)
        VALUES (${data.salesman_code}, ${data.salesman_name})
        RETURNING id
      `;
      salesmanId = newSalesman[0].id;
    }

    // Upsert outlet
    let outletId: string;
    const existingOutlet = await sql`
      SELECT id FROM outlets WHERE code = ${data.outlet_code} LIMIT 1
    `;

    if (existingOutlet.length > 0) {
      outletId = existingOutlet[0].id;
    } else {
      if (!data.outlet_name) {
        return NextResponse.json(
          { error: "outlet_name wajib diisi untuk outlet baru" },
          { status: 400 }
        );
      }

      const newOutlet = await sql`
        INSERT INTO outlets (code, name)
        VALUES (${data.outlet_code}, ${data.outlet_name})
        RETURNING id
      `;
      outletId = newOutlet[0].id;
    }

    // Insert sale
    const sale = await sql`
      INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no)
      VALUES (${salesmanId}, ${outletId}, ${data.ts}, ${data.amount}, ${data.qty}, ${data.invoice_no ?? null})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      sale_id: sale[0].id,
      salesman_id: salesmanId,
      outlet_id: outletId,
    });
  } catch (error) {
    console.error("Error penjualan:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
