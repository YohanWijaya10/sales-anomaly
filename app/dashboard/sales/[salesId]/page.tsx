"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface SalesmanMetrics {
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

interface RedFlag {
  code: string;
  title: string;
  severity: "low" | "medium" | "high";
  reason: string;
}

interface SalesmanData {
  salesman: {
    id: string;
    code: string;
    name: string;
  };
  daily_metrics: SalesmanMetrics[];
  totals: {
    total_visits: number;
    total_unique_outlets: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
  };
  red_flag_history: Array<{
    date: string;
    flags: RedFlag[];
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function SalesmanDetailPage() {
  const params = useParams<{ salesId?: string | string[] }>();
  const salesIdParam = params?.salesId;
  const salesId = Array.isArray(salesIdParam) ? salesIdParam[0] : salesIdParam;

  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [data, setData] = useState<SalesmanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      if (!salesId) {
        setError("Sales ID tidak valid");
        setLoading(false);
        return;
      }

      const days = range === "7d" ? 7 : 30;
      const { from, to } = getDateRange(days);

      try {
        const response = await fetch(
          `/api/analytics/salesman?salesman_id=${salesId}&from=${from}&to=${to}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Gagal mengambil data");
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [salesId, range]);

  const severityColors = {
    high: "bg-[#2a1111] text-[#ffb3b3] border-[#5a1d1d]",
    medium: "bg-[#2a240f] text-[#f2d27a] border-[#5a4a1d]",
    low: "bg-[#112329] text-[#8fd3ff] border-[#1e3f4a]",
  };

  const chartData =
    data?.daily_metrics
      ?.slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((dm) => ({
        date: dm.date,
        penjualan: Number(dm.total_sales_amount || 0),
        kunjungan: Number(dm.visit_count || 0),
        konversi: Number(dm.conversion_rate || 0) * 100,
      })) || [];

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-[#c9f24b] hover:underline flex items-center gap-1"
              >
                <span>&larr;</span> Kembali
              </Link>
              <h1 className="text-2xl font-bold text-[#e6e6e6]">
                {data?.salesman?.name || "Memuat..."}
              </h1>
              {data?.salesman?.code && (
                <span className="text-[#9aa0a6] text-sm">{data.salesman.code}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRange("7d")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  range === "7d"
                    ? "bg-[#c9f24b] text-[#1a1a1a]"
                    : "bg-[#1b1b1b] text-[#cfd4d8] hover:bg-[#222222]"
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setRange("30d")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  range === "30d"
                    ? "bg-[#c9f24b] text-[#1a1a1a]"
                    : "bg-[#1b1b1b] text-[#cfd4d8] hover:bg-[#222222]"
                }`}
              >
                30 Hari Terakhir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9f24b]"></div>
          </div>
        ) : error ? (
          <div className="bg-[#2a1111] border border-[#5a1d1d] rounded-lg p-4">
            <p className="text-[#ffb3b3]">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Kunjungan</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.totals.total_visits}
                </p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Outlet Unik</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.totals.total_unique_outlets}
                </p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Penjualan</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {formatCurrency(data.totals.total_sales_amount)}
                </p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Unit</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.totals.total_sales_qty}
                </p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Rata-rata Konversi</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {formatPercentage(data.totals.avg_conversion_rate)}
                </p>
              </div>
            </div>

            {/* Red Flag History */}
            {data.red_flag_history.length > 0 && (
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h2 className="text-lg font-semibold text-[#e6e6e6] mb-4">
                  Riwayat Tanda Risiko
                </h2>
                <div className="space-y-3">
                  {data.red_flag_history.map((day) => (
                    <div key={day.date} className="border border-[#262626] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#e6e6e6]">{day.date}</span>
                        <span className="text-sm text-[#9aa0a6]">
                          {day.flags.length} tanda
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {day.flags.map((flag, i) => (
                          <div
                            key={i}
                            className={`px-3 py-2 rounded-md text-sm border ${severityColors[flag.severity]}`}
                          >
                            <span className="font-medium">{flag.title}</span>
                            <p className="text-xs mt-1 opacity-80">{flag.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Metrics Table */}
            <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222]">
                <h2 className="text-lg font-semibold text-[#e6e6e6]">Rincian Harian</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#222222]">
                  <thead className="bg-[#121212]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Kunjungan
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Outlet Unik
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Nilai Penjualan
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Outlet dengan Penjualan
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Konversi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#151515] divide-y divide-[#222222]">
                    {data.daily_metrics
                      .slice()
                      .reverse()
                      .map((dm) => {
                        const hasFlag = data.red_flag_history.some(
                          (rf) => rf.date === dm.date
                        );
                        return (
                          <tr
                            key={dm.date}
                            className={`${hasFlag ? "bg-[#2a1111]" : ""} hover:bg-[#1b1b1b]`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-[#e6e6e6]">{dm.date}</span>
                              {hasFlag && (
                                <span className="ml-2 text-xs text-[#ffb3b3]">
                                  (ditandai)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                              {dm.visit_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                              {dm.unique_outlet_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-[#e6e6e6]">
                              {formatCurrency(dm.total_sales_amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                              {dm.total_sales_qty}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                              {dm.outlet_with_sales_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <span
                                className={`${
                                  dm.conversion_rate >= 0.5
                                    ? "text-[#c9f24b]"
                                    : dm.conversion_rate > 0
                                    ? "text-[#f2d27a]"
                                    : "text-[#ff8b8b]"
                                }`}
                              >
                                {formatPercentage(dm.conversion_rate)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
              <h2 className="text-lg font-semibold text-[#e6e6e6] mb-4">
                Tren Performa
              </h2>
              <div className="h-72 rounded-lg bg-[#111111] border border-[#222222] p-3">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#9aa0a6]">
                    Belum ada data untuk divisualisasikan
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c9f24b" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#0b0b0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: "#9aa0a6", fontSize: 12 }} />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: "#9aa0a6", fontSize: 12 }}
                        tickFormatter={(v) => formatCompactNumber(Number(v))}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: "#9aa0a6", fontSize: 12 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#151515",
                          border: "1px solid #222222",
                          color: "#e6e6e6",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "Penjualan") return [formatCurrency(value), name];
                          if (name === "Konversi") return [`${value.toFixed(1)}%`, name];
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ color: "#cfd4d8" }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="penjualan"
                        name="Penjualan"
                        stroke="#c9f24b"
                        fill="url(#salesGradient)"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="kunjungan"
                        name="Kunjungan"
                        stroke="#8fd3ff"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="konversi"
                        name="Konversi"
                        stroke="#f2d27a"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
