"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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

interface SalesmanRedFlags {
  salesman_id: string;
  salesman_code: string;
  salesman_name: string;
  red_flags: RedFlag[];
}

interface WeeklyInsight {
  period: { from: string; to: string };
  summary: {
    highlights: string[];
    risks: string[];
    actions: string[];
  };
  detail: string;
  notes: string;
}

interface WeeklyIssueFlag {
  code: string;
  title: string;
  severity: "low" | "medium" | "high";
  count: number;
  reasons: string[];
}

interface WeeklyIssue {
  salesman_id: string;
  salesman_code: string;
  salesman_name: string;
  total_flags: number;
  severity_counts: { high: number; medium: number; low: number };
  flags: WeeklyIssueFlag[];
}

interface LeaderRegionData {
  date: string;
  leaders: Array<{
    id: string;
    code: string;
    name: string;
    visit_count: number;
    unique_outlet_count: number;
    total_sales_amount: number;
    total_sales_qty: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
  regions: Array<{
    id: string;
    code: string;
    name: string;
    leader_id: string | null;
    visit_count: number;
    unique_outlet_count: number;
    total_sales_amount: number;
    total_sales_qty: number;
    outlet_with_sales_count: number;
    conversion_rate: number;
  }>;
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
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [weeklyIssues, setWeeklyIssues] = useState<WeeklyIssue[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [leaderRegion, setLeaderRegion] = useState<LeaderRegionData | null>(null);
  const [leaderRegionLoading, setLeaderRegionLoading] = useState(false);
  const [leaderRegionError, setLeaderRegionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchWeekly() {
      setWeeklyLoading(true);
      setWeeklyError(null);

      try {
        const response = await fetch(`/api/insights/weekly`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Gagal mengambil laporan mingguan");
        }

        setWeeklyInsight(result.data);
        setWeeklyIssues(result.meta?.issues || []);
      } catch (err) {
        setWeeklyError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setWeeklyLoading(false);
      }
    }

    fetchWeekly();
  }, []);

  useEffect(() => {
    async function fetchLeaderRegion() {
      setLeaderRegionLoading(true);
      setLeaderRegionError(null);
      try {
        const response = await fetch(`/api/analytics/leader-region?date=${selectedDate}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Gagal mengambil data leader/region");
        }
        setLeaderRegion(result.data);
      } catch (err) {
        setLeaderRegionError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLeaderRegionLoading(false);
      }
    }
    fetchLeaderRegion();
  }, [selectedDate]);

  const severityColors = {
    high: "bg-[#2a1111] text-[#ffb3b3] border-[#5a1d1d]",
    medium: "bg-[#2a240f] text-[#f2d27a] border-[#5a4a1d]",
    low: "bg-[#112329] text-[#8fd3ff] border-[#1e3f4a]",
  };

  const pieColors = ["#c9f24b", "#8fd3ff", "#f2d27a", "#ff8b8b", "#b18cff", "#7ef0c1"];

  const contributionData =
    data?.metrics?.salesmen_metrics
      ?.filter((m) => Number(m.total_sales_amount || 0) > 0)
      .map((m) => ({
        name: m.salesman_name,
        value: Number(m.total_sales_amount || 0),
      })) || [];

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

            {/* Weekly Report */}
            <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#e6e6e6]">
                    Laporan Mingguan
                  </h2>
                  {weeklyInsight?.period && (
                    <p className="text-xs text-[#9aa0a6] mt-1">
                      {weeklyInsight.period.from} – {weeklyInsight.period.to}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setWeeklyInsight(null);
                    setWeeklyLoading(true);
                    setWeeklyError(null);
                    fetch(`/api/insights/weekly?refresh=1`)
                      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
                      .then(({ ok, d }) => {
                        if (!ok) throw new Error(d.error || "Gagal mengambil laporan mingguan");
                        setWeeklyInsight(d.data);
                        setWeeklyIssues(d.meta?.issues || []);
                      })
                      .catch((err) =>
                        setWeeklyError(err instanceof Error ? err.message : "Terjadi kesalahan")
                      )
                      .finally(() => setWeeklyLoading(false));
                  }}
                  className="px-3 py-1.5 bg-[#1b1b1b] text-[#cfd4d8] rounded-md text-xs font-medium border border-[#2a2a2a] hover:bg-[#222222]"
                >
                  Refresh
                </button>
              </div>

              {weeklyLoading ? (
                <div className="flex items-center justify-center h-36">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9f24b]"></div>
                </div>
              ) : weeklyError ? (
                <div className="bg-[#2a1111] border border-[#5a1d1d] rounded-lg p-4">
                  <p className="text-[#ffb3b3]">{weeklyError}</p>
                </div>
              ) : weeklyInsight ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#142010] rounded-lg border border-[#22361a] p-4">
                      <h3 className="font-medium text-[#c9f24b] mb-2">Sorotan</h3>
                      <ul className="space-y-1 text-sm text-[#cde7a6]">
                        {weeklyInsight.summary.highlights.map((h, i) => (
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
                        {weeklyInsight.summary.risks.map((r, i) => (
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
                        {weeklyInsight.summary.actions.map((a, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">-&gt;</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-[#0f0f0f] border border-[#222222] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-[#e6e6e6]">Detail Insiden Mingguan</h3>
                      <span className="text-xs text-[#9aa0a6]">
                        {weeklyIssues.length} sales terdampak
                      </span>
                    </div>
                    {weeklyIssues.length === 0 ? (
                      <p className="text-sm text-[#9aa0a6]">
                        Tidak ada insiden yang terdeteksi minggu ini.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {weeklyIssues.map((issue) => (
                          <div
                            key={issue.salesman_id}
                            className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm font-semibold text-[#e6e6e6]">
                                  {issue.salesman_name}
                                </div>
                                <div className="text-xs text-[#9aa0a6]">
                                  {issue.salesman_code}
                                </div>
                              </div>
                              <div className="text-xs text-[#cfd4d8]">
                                {issue.total_flags} insiden
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-[#2a1111] text-[#ffb3b3] border border-[#5a1d1d]">
                                High: {issue.severity_counts.high}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#2a240f] text-[#f2d27a] border border-[#5a4a1d]">
                                Medium: {issue.severity_counts.medium}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#112329] text-[#8fd3ff] border border-[#1e3f4a]">
                                Low: {issue.severity_counts.low}
                              </span>
                            </div>
                            <div className="mt-3 space-y-2 text-sm text-[#cfd4d8]">
                              {issue.flags.map((flag) => (
                                <div
                                  key={flag.code}
                                  className="bg-[#101010] border border-[#222222] rounded-md p-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{flag.title}</div>
                                    <div className="text-xs text-[#9aa0a6]">
                                      {flag.count}x
                                    </div>
                                  </div>
                                  {flag.reasons.length > 0 && (
                                    <ul className="mt-1 text-xs text-[#9aa0a6] list-disc list-inside">
                                      {flag.reasons.map((reason, idx) => (
                                        <li key={idx}>{reason}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 text-sm text-[#cfd4d8]">
                    {weeklyInsight.detail}
                  </div>
                </div>
              ) : (
                <p className="text-[#9aa0a6] text-sm">Belum ada laporan mingguan.</p>
              )}
            </div>

            {/* Leader / Region Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#222222]">
                  <h2 className="text-lg font-semibold text-[#e6e6e6]">
                    Performa per Leader
                  </h2>
                </div>
                {leaderRegionLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9f24b]"></div>
                  </div>
                ) : leaderRegionError ? (
                  <div className="bg-[#2a1111] border border-[#5a1d1d] rounded-lg m-4 p-4">
                    <p className="text-[#ffb3b3]">{leaderRegionError}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#222222]">
                      <thead className="bg-[#121212]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Leader
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Kunjungan
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Penjualan
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Konversi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#151515] divide-y divide-[#222222]">
                        {(leaderRegion?.leaders || []).map((l) => (
                          <tr key={l.id} className="hover:bg-[#1b1b1b]">
                            <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                              <div className="font-medium">{l.name}</div>
                              <div className="text-xs text-[#9aa0a6]">{l.code}</div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                              {l.visit_count}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                              {formatCurrency(l.total_sales_amount)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              <span
                                className={`${
                                  l.conversion_rate >= 0.5
                                    ? "text-[#c9f24b]"
                                    : l.conversion_rate > 0
                                    ? "text-[#f2d27a]"
                                    : "text-[#ff8b8b]"
                                }`}
                              >
                                {formatPercentage(l.conversion_rate)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(leaderRegion?.leaders || []).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-6 text-center text-sm text-[#9aa0a6]"
                            >
                              Belum ada data leader untuk tanggal ini
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#222222]">
                  <h2 className="text-lg font-semibold text-[#e6e6e6]">
                    Performa per Wilayah
                  </h2>
                </div>
                {leaderRegionLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9f24b]"></div>
                  </div>
                ) : leaderRegionError ? (
                  <div className="bg-[#2a1111] border border-[#5a1d1d] rounded-lg m-4 p-4">
                    <p className="text-[#ffb3b3]">{leaderRegionError}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#222222]">
                      <thead className="bg-[#121212]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Wilayah
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Kunjungan
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Penjualan
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                            Konversi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#151515] divide-y divide-[#222222]">
                        {(leaderRegion?.regions || []).map((r) => (
                          <tr key={r.id} className="hover:bg-[#1b1b1b]">
                            <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-[#9aa0a6]">{r.code}</div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                              {r.visit_count}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                              {formatCurrency(r.total_sales_amount)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              <span
                                className={`${
                                  r.conversion_rate >= 0.5
                                    ? "text-[#c9f24b]"
                                    : r.conversion_rate > 0
                                    ? "text-[#f2d27a]"
                                    : "text-[#ff8b8b]"
                                }`}
                              >
                                {formatPercentage(r.conversion_rate)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(leaderRegion?.regions || []).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-6 text-center text-sm text-[#9aa0a6]"
                            >
                              Belum ada data wilayah untuk tanggal ini
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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

            {/* Kontribusi Penjualan */}
            <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#e6e6e6]">
                  Kontribusi Penjualan per Sales
                </h2>
                <span className="text-xs text-[#9aa0a6]">
                  Total: {formatCurrency(data.metrics.total_sales_amount)}
                </span>
              </div>
              <div className="h-72">
                {contributionData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#9aa0a6]">
                    Belum ada data penjualan
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contributionData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        stroke="#0b0b0b"
                      >
                        {contributionData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#151515",
                          border: "1px solid #222222",
                          color: "#ffffff",
                        }}
                        formatter={(value: number) => formatCurrency(Number(value))}
                        labelStyle={{ color: "#ffffff" }}
                        itemStyle={{ color: "#ffffff" }}
                      />
                      <Legend
                        wrapperStyle={{ color: "#ffffff" }}
                        formatter={(value: string) => (
                          <span className="text-white">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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
