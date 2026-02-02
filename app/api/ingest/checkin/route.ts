import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";

const CheckinSchema = z.object({
  salesman_code: z.string().min(1),
  salesman_name: z.string().min(1).optional(),
  outlet_code: z.string().min(1),
  outlet_name: z.string().min(1).optional(),
  ts: z.string().datetime(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CheckinSchema.safeParse(body);

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
      SELECT id, leader_id, region_id FROM salesmen WHERE code = ${data.salesman_code} LIMIT 1
    `;

    let leaderId: string | null = null;
    let regionId: string | null = null;
    if (existingSalesman.length > 0) {
      salesmanId = existingSalesman[0].id;
      leaderId = existingSalesman[0].leader_id ?? null;
      regionId = existingSalesman[0].region_id ?? null;
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
        RETURNING id, leader_id, region_id
      `;
      salesmanId = newSalesman[0].id;
      leaderId = newSalesman[0].leader_id ?? null;
      regionId = newSalesman[0].region_id ?? null;
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
        INSERT INTO outlets (code, name, lat, lng)
        VALUES (${data.outlet_code}, ${data.outlet_name}, ${data.lat ?? null}, ${data.lng ?? null})
        RETURNING id
      `;
      outletId = newOutlet[0].id;
    }

    // Insert checkin
    const checkin = await sql`
      INSERT INTO checkins (salesman_id, leader_id, region_id, outlet_id, ts, lat, lng, notes)
      VALUES (
        ${salesmanId},
        ${leaderId},
        ${regionId},
        ${outletId},
        ${data.ts},
        ${data.lat ?? null},
        ${data.lng ?? null},
        ${data.notes ?? null}
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      checkin_id: checkin[0].id,
      salesman_id: salesmanId,
      outlet_id: outletId,
    });
  } catch (error) {
    console.error("Error check-in:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
