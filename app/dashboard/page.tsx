"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

interface SalesmanRedFlags {
  salesman_id: string;
  salesman_code: string;
  salesman_name: string;
  red_flags: RedFlag[];
}

interface DailyInsight {
  date: string;
  highlights: string[];
  risks: string[];
  actions: string[];
  notes: string;
}

interface DailyData {
  metrics: {
    date: string;
    total_visits: number;
    total_salesmen: number;
    total_sales_amount: number;
    total_sales_qty: number;
    avg_conversion_rate: number;
    salesmen_metrics: SalesmanMetrics[];
  };
  red_flags: SalesmanRedFlags[];
  rankings: {
    top_by_conversion: Array<{ salesman_id: string; salesman_name: string; conversion_rate: number }>;
    bottom_by_conversion: Array<{ salesman_id: string; salesman_name: string; conversion_rate: number }>;
    top_by_sales: Array<{ salesman_id: string; salesman_name: string; total_sales_amount: number }>;
    bottom_by_sales: Array<{ salesman_id: string; salesman_name: string; total_sales_amount: number }>;
    top_by_visits: Array<{ salesman_id: string; salesman_name: string; visit_count: number }>;
  };
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

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [data, setData] = useState<DailyData | null>(null);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [insightMeta, setInsightMeta] = useState<{ from_llm: boolean; cached: boolean } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics/daily?date=${selectedDate}`);
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
  }, [selectedDate]);

  async function fetchInsight() {
    setInsightLoading(true);

    try {
      const response = await fetch(`/api/insights/daily?date=${selectedDate}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengambil insight");
      }

      setInsight(result.data);
      setInsightMeta({ from_llm: Boolean(result.from_llm), cached: Boolean(result.cached) });
    } catch (err) {
      console.error("Gagal mengambil insight:", err);
    } finally {
      setInsightLoading(false);
    }
  }

  const severityColors = {
    high: "bg-[#2a1111] text-[#ffb3b3] border-[#5a1d1d]",
    medium: "bg-[#2a240f] text-[#f2d27a] border-[#5a4a1d]",
    low: "bg-[#112329] text-[#8fd3ff] border-[#1e3f4a]",
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#e6e6e6]">
              Dasbor Performa Sales
            </h1>
            <div className="flex items-center gap-4">
              <label htmlFor="date" className="text-sm font-medium text-[#bfc5c9]">
                Tanggal:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-[#2a2a2a] bg-[#111111] text-[#e6e6e6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#c9f24b] focus:border-[#c9f24b]"
              />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Kunjungan</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.metrics.total_visits}
                </p>
                <p className="text-sm text-[#9aa0a6] mt-1">
                  oleh {data.metrics.total_salesmen} sales
                </p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Penjualan</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {formatCurrency(data.metrics.total_sales_amount)}
                </p>
                <p className="text-sm text-[#9aa0a6] mt-1">
                  {data.metrics.total_sales_qty} unit
                </p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Rata-rata Konversi</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {formatPercentage(data.metrics.avg_conversion_rate)}
                </p>
                <p className="text-sm text-[#9aa0a6] mt-1">outlet menjadi penjualan</p>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Tanda Risiko</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.red_flags.reduce((sum, rf) => sum + rf.red_flags.length, 0)}
                </p>
                <p className="text-sm text-[#9aa0a6] mt-1">
                  {data.red_flags.length} sales terindikasi
                </p>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#e6e6e6]">Insight AI</h2>
                  <div className="flex items-center gap-3 text-xs text-[#9aa0a6]">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#c9f24b]"></span>
                      AI
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#f2d27a]"></span>
                      Template
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#ff8b8b]"></span>
                      Cache
                    </span>
                    {insightMeta && (
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          insightMeta.cached
                            ? "bg-[#ff8b8b]"
                            : insightMeta.from_llm
                            ? "bg-[#c9f24b]"
                            : "bg-[#f2d27a]"
                        }`}
                        title={
                          insightMeta.cached
                            ? "Cache"
                            : insightMeta.from_llm
                            ? "AI (DeepSeek)"
                            : "Template"
                        }
                      ></span>
                    )}
                  </div>
                </div>
                <button
                  onClick={fetchInsight}
                  disabled={insightLoading}
                  className="px-4 py-2 bg-[#c9f24b] text-[#1a1a1a] rounded-md text-sm font-medium hover:bg-[#b6e13a] disabled:bg-[#3a3a3a] disabled:text-[#9aa0a6] disabled:cursor-not-allowed"
                >
                  {insightLoading ? "Membuat..." : "Buat Insight"}
                </button>
              </div>

              {insight ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#142010] rounded-lg border border-[#22361a] p-4">
                    <h3 className="font-medium text-[#c9f24b] mb-2">Sorotan</h3>
                    <ul className="space-y-1 text-sm text-[#cde7a6]">
                      {insight.highlights.map((h, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">+</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#2a1111] rounded-lg border border-[#5a1d1d] p-4">
                    <h3 className="font-medium text-[#ffb3b3] mb-2">Risiko</h3>
                    <ul className="space-y-1 text-sm text-[#f0b0b0]">
                      {insight.risks.map((r, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">!</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#112329] rounded-lg border border-[#1e3f4a] p-4">
                    <h3 className="font-medium text-[#8fd3ff] mb-2">Tindakan</h3>
                    <ul className="space-y-1 text-sm text-[#b5e2ff]">
                      {insight.actions.map((a, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">-&gt;</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-[#9aa0a6] text-sm">
                  Klik &quot;Buat Insight&quot; untuk mendapatkan analisis AI atas data hari ini.
                </p>
              )}
            </div>

            {/* Red Flags */}
            {data.red_flags.length > 0 && (
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h2 className="text-lg font-semibold text-[#e6e6e6] mb-4">
                  Tanda Risiko ({data.red_flags.reduce((sum, rf) => sum + rf.red_flags.length, 0)})
                </h2>
                <div className="space-y-3">
                  {data.red_flags.map((rf) => (
                    <div key={rf.salesman_id} className="border border-[#262626] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/dashboard/sales/${rf.salesman_id}`}
                          className="font-medium text-[#c9f24b] hover:underline"
                        >
                          {rf.salesman_name}
                        </Link>
                        <span className="text-sm text-[#9aa0a6]">{rf.salesman_code}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rf.red_flags.map((flag, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-full text-xs border ${severityColors[flag.severity]}`}
                            title={flag.reason}
                          >
                            {flag.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top by Conversion */}
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-lg font-semibold text-[#e6e6e6] mb-4">
                  Konversi Tertinggi
                </h3>
                <div className="space-y-3">
                  {data.rankings.top_by_conversion.map((item, i) => (
                    <div key={item.salesman_id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-[#1f2a12] text-[#c9f24b] text-sm flex items-center justify-center mr-3">
                          {i + 1}
                        </span>
                        <Link
                          href={`/dashboard/sales/${item.salesman_id}`}
                          className="text-[#c9f24b] hover:underline"
                        >
                          {item.salesman_name}
                        </Link>
                      </div>
                      <span className="font-medium text-[#c9f24b]">
                        {formatPercentage(item.conversion_rate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top by Sales */}
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-lg font-semibold text-[#e6e6e6] mb-4">
                  Nilai Penjualan Tertinggi
                </h3>
                <div className="space-y-3">
                  {data.rankings.top_by_sales.map((item, i) => (
                    <div key={item.salesman_id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-[#1f2a12] text-[#c9f24b] text-sm flex items-center justify-center mr-3">
                          {i + 1}
                        </span>
                        <Link
                          href={`/dashboard/sales/${item.salesman_id}`}
                          className="text-[#c9f24b] hover:underline"
                        >
                          {item.salesman_name}
                        </Link>
                      </div>
                      <span className="font-medium text-[#c9f24b]">
                        {formatCurrency(item.total_sales_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top by Visits */}
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-lg font-semibold text-[#e6e6e6] mb-4">
                  Kunjungan Terbanyak
                </h3>
                <div className="space-y-3">
                  {data.rankings.top_by_visits.map((item, i) => (
                    <div key={item.salesman_id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-[#1f2a12] text-[#c9f24b] text-sm flex items-center justify-center mr-3">
                          {i + 1}
                        </span>
                        <Link
                          href={`/dashboard/sales/${item.salesman_id}`}
                          className="text-[#c9f24b] hover:underline"
                        >
                          {item.salesman_name}
                        </Link>
                      </div>
                      <span className="font-medium text-[#c9f24b]">
                        {item.visit_count} kunjungan
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Salesmen Table */}
            <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222]">
                <h2 className="text-lg font-semibold text-[#e6e6e6]">Semua Sales</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#222222]">
                  <thead className="bg-[#121212]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Sales
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
                        Konversi
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                        Tanda
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#151515] divide-y divide-[#222222]">
                    {data.metrics.salesmen_metrics.map((sm) => {
                      const flags = data.red_flags.find(
                        (rf) => rf.salesman_id === sm.salesman_id
                      );
                      return (
                        <tr key={sm.salesman_id} className="hover:bg-[#1b1b1b]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/dashboard/sales/${sm.salesman_id}`}
                              className="text-[#c9f24b] hover:underline font-medium"
                            >
                              {sm.salesman_name}
                            </Link>
                            <p className="text-xs text-[#9aa0a6]">{sm.salesman_code}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                            {sm.visit_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                            {sm.unique_outlet_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-[#e6e6e6]">
                            {formatCurrency(sm.total_sales_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                            {sm.total_sales_qty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <span
                              className={`${
                                sm.conversion_rate >= 0.5
                                  ? "text-[#c9f24b]"
                                  : sm.conversion_rate > 0
                                  ? "text-[#f2d27a]"
                                  : "text-[#ff8b8b]"
                              }`}
                            >
                              {formatPercentage(sm.conversion_rate)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {flags && flags.red_flags.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#2a1111] text-[#ffb3b3]">
                                {flags.red_flags.length}
                              </span>
                            ) : (
                              <span className="text-[#60656a]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
