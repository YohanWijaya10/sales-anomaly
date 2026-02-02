import { neon } from "@neondatabase/serverless";

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  return neon(databaseUrl);
}

export type Salesman = {
  id: string;
  code: string;
  name: string;
  leader_id: string | null;
  region_id: string | null;
  active: boolean;
  created_at: string;
};

export type Leader = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
};

export type Region = {
  id: string;
  code: string;
  name: string;
  leader_id: string | null;
  created_at: string;
};

export type Outlet = {
  id: string;
  code: string;
  name: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type Checkin = {
  id: string;
  salesman_id: string;
  outlet_id: string | null;
  ts: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  salesman_id: string;
  outlet_id: string | null;
  ts: string;
  amount: number;
  qty: number;
  invoice_no: string | null;
  created_at: string;
};

export type DailyInsightCache = {
  id: string;
  date: string;
  payload_json: Record<string, unknown>;
  created_at: string;
};
