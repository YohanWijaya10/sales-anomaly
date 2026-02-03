import { getDb } from "@/lib/db/neon";
import { getDateRange } from "@/lib/utils/date";

export interface SalesmanMetrics {
  salesman_id: string;
  salesman_code: string;
  salesman_name: string;
  date: string;
  visit_count: number;
  unique_outlet_count: number;
  total_sales_amount: number;
  total_sales_qty: number;
  outlet_with_sales_count: number;
  conversion_rate: number;
}

export interface AggregatedMetrics {
  date: string;
  total_visits: number;
  total_salesmen: number;
  total_sales_amount: number;
  total_sales_qty: number;
  avg_conversion_rate: number;
  salesmen_metrics: SalesmanMetrics[];
}

export async function computeDailyMetricsForDate(
  date: string
): Promise<AggregatedMetrics> {
  const sql = getDb();
  const { startOfDay, endOfDay } = getDateRange(date);

  // Get all active salesmen
  const salesmen = await sql`
    SELECT id, code, name FROM salesmen WHERE active = true
  `;

  if (!salesmen || salesmen.length === 0) {
    return {
      date,
      total_visits: 0,
      total_salesmen: 0,
      total_sales_amount: 0,
      total_sales_qty: 0,
      avg_conversion_rate: 0,
      salesmen_metrics: [],
    };
  }

  const salesmenMetrics: SalesmanMetrics[] = [];

  for (const salesman of salesmen) {
    // Get checkins for this salesman on this date
    const checkins = await sql`
      SELECT id, outlet_id FROM checkins
      WHERE salesman_id = ${salesman.id}
        AND ts >= ${startOfDay}::timestamptz
        AND ts <= ${endOfDay}::timestamptz
    `;

    // Get sales for this salesman on this date
    const sales = await sql`
      SELECT id, outlet_id, amount, qty FROM sales
      WHERE salesman_id = ${salesman.id}
        AND ts >= ${startOfDay}::timestamptz
        AND ts <= ${endOfDay}::timestamptz
    `;

    const visit_count = checkins.length;
    const unique_outlets = new Set(
      checkins.map((c) => c.outlet_id).filter(Boolean)
    );
    const unique_outlet_count = unique_outlets.size;

    const total_sales_amount = sales.reduce(
      (sum, s) => sum + Number(s.amount || 0),
      0
    );
    const total_sales_qty = sales.reduce(
      (sum, s) => sum + Number(s.qty || 0),
      0
    );

    const outlets_with_sales = new Set(
      sales
        .filter((s) => Number(s.amount) > 0)
        .map((s) => s.outlet_id)
        .filter(Boolean)
    );
    const outlet_with_sales_count = outlets_with_sales.size;

    const conversion_rate =
      visit_count > 0 ? outlet_with_sales_count / visit_count : 0;

    salesmenMetrics.push({
      salesman_id: salesman.id,
      salesman_code: salesman.code,
      salesman_name: salesman.name,
      date,
      visit_count,
      unique_outlet_count,
      total_sales_amount,
      total_sales_qty,
      outlet_with_sales_count,
      conversion_rate,
    });
  }

  const total_visits = salesmenMetrics.reduce((sum, m) => sum + m.visit_count, 0);
  const total_sales_amount = salesmenMetrics.reduce(
    (sum, m) => sum + m.total_sales_amount,
    0
  );
  const total_sales_qty = salesmenMetrics.reduce(
    (sum, m) => sum + m.total_sales_qty,
    0
  );

  const salesmenWithVisits = salesmenMetrics.filter((m) => m.visit_count > 0);
  const avg_conversion_rate =
    salesmenWithVisits.length > 0
      ? salesmenWithVisits.reduce((sum, m) => sum + m.conversion_rate, 0) /
        salesmenWithVisits.length
      : 0;

  return {
    date,
    total_visits,
    total_salesmen: salesmen.length,
    total_sales_amount,
    total_sales_qty,
    avg_conversion_rate,
    salesmen_metrics: salesmenMetrics,
  };
}

export async function computeMetricsForSalesman(
  salesmanId: string,
  from: string,
  to: string
): Promise<{
  salesman: { id: string; code: string; name: string } | null;
  daily_metrics: SalesmanMetrics[];
  totals: {
    total_visits: number;
    total_unique_outlets: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
  };
}> {
  const sql = getDb();

  // Get salesman info
  const salesmanResult = await sql`
    SELECT id, code, name FROM salesmen WHERE id = ${salesmanId} LIMIT 1
  `;

  if (!salesmanResult || salesmanResult.length === 0) {
    return {
      salesman: null,
      daily_metrics: [],
      totals: {
        total_visits: 0,
        total_unique_outlets: 0,
        total_sales_amount: 0,
        total_sales_qty: 0,
        avg_conversion_rate: 0,
      },
    };
  }

  const salesman = salesmanResult[0];

  // Generate date range
  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const daily_metrics: SalesmanMetrics[] = [];

  for (const date of dates) {
    const { startOfDay, endOfDay } = getDateRange(date);

    const checkins = await sql`
      SELECT id, outlet_id FROM checkins
      WHERE salesman_id = ${salesmanId}
        AND ts >= ${startOfDay}::timestamptz
        AND ts <= ${endOfDay}::timestamptz
    `;

    const sales = await sql`
      SELECT id, outlet_id, amount, qty FROM sales
      WHERE salesman_id = ${salesmanId}
        AND ts >= ${startOfDay}::timestamptz
        AND ts <= ${endOfDay}::timestamptz
    `;

    const visit_count = checkins.length;
    const unique_outlets = new Set(
      checkins.map((c) => c.outlet_id).filter(Boolean)
    );
    const unique_outlet_count = unique_outlets.size;

    const total_sales_amount = sales.reduce(
      (sum, s) => sum + Number(s.amount || 0),
      0
    );
    const total_sales_qty = sales.reduce(
      (sum, s) => sum + Number(s.qty || 0),
      0
    );

    const outlets_with_sales = new Set(
      sales
        .filter((s) => Number(s.amount) > 0)
        .map((s) => s.outlet_id)
        .filter(Boolean)
    );
    const outlet_with_sales_count = outlets_with_sales.size;

    const conversion_rate =
      visit_count > 0 ? outlet_with_sales_count / visit_count : 0;

    daily_metrics.push({
      salesman_id: salesman.id,
      salesman_code: salesman.code,
      salesman_name: salesman.name,
      date,
      visit_count,
      unique_outlet_count,
      total_sales_amount,
      total_sales_qty,
      outlet_with_sales_count,
      conversion_rate,
    });
  }

  const total_visits = daily_metrics.reduce((sum, m) => sum + m.visit_count, 0);
  const total_unique_outlets = daily_metrics.reduce(
    (max, m) => Math.max(max, m.unique_outlet_count),
    0
  );
  const total_sales_amount = daily_metrics.reduce(
    (sum, m) => sum + m.total_sales_amount,
    0
  );
  const total_sales_qty = daily_metrics.reduce(
    (sum, m) => sum + m.total_sales_qty,
    0
  );

  const daysWithVisits = daily_metrics.filter((m) => m.visit_count > 0);
  const avg_conversion_rate =
    daysWithVisits.length > 0
      ? daysWithVisits.reduce((sum, m) => sum + m.conversion_rate, 0) /
        daysWithVisits.length
      : 0;

  return {
    salesman: {
      id: salesman.id,
      code: salesman.code,
      name: salesman.name,
    },
    daily_metrics,
    totals: {
      total_visits,
      total_unique_outlets,
      total_sales_amount,
      total_sales_qty,
      avg_conversion_rate,
    },
  };
}
