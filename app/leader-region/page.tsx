"use client";

import { useEffect, useState } from "react";

interface LeaderRegionData {
  date: string | null;
  period: { from: string; to: string } | null;
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

export default function LeaderRegionPage() {
  const [mode, setMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [data, setData] = useState<LeaderRegionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getWeekRange(dateStr: string): { from: string; to: string } {
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    const day = date.getUTCDay(); // 0 = Sunday
    const diffToMonday = (day + 6) % 7;
    const start = new Date(date);
    start.setUTCDate(start.getUTCDate() - diffToMonday);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  }

  function getMonthRange(dateStr: string): { from: string; to: string } {
    const [year, month] = dateStr.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const query =
          mode === "daily"
            ? `date=${selectedDate}`
            : mode === "weekly"
            ? (() => {
                const period = getWeekRange(selectedDate);
                return `from=${period.from}&to=${period.to}`;
              })()
            : (() => {
                const period = getMonthRange(selectedDate);
                return `from=${period.from}&to=${period.to}`;
              })();
        const response = await fetch(`/api/analytics/leader-region?${query}`);
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
  }, [mode, selectedDate]);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#e6e6e6]">
              Leader & Region
            </h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor="mode" className="text-sm font-medium text-[#bfc5c9]">
                Periode:
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "daily" | "weekly" | "monthly")}
                className="border border-[#2a2a2a] bg-[#111111] text-[#e6e6e6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#c9f24b] focus:border-[#c9f24b]"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
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
              {data?.period && (
                <span className="text-xs text-[#9aa0a6]">
                  {data.period.from} – {data.period.to}
                </span>
              )}
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
            <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#e6e6e6]">
                  Hirarki Leader → Region
                </h2>
                <span className="text-xs text-[#9aa0a6]">
                  {data.period ? `${data.period.from} – ${data.period.to}` : "Rolling"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.leaders.map((leader) => {
                  const regions = data.regions.filter((r) => r.leader_id === leader.id);
                  return (
                    <div
                      key={leader.id}
                      className="bg-[#111111] border border-[#222222] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-[#e6e6e6]">
                            {leader.name}
                          </div>
                          <div className="text-xs text-[#9aa0a6]">{leader.code}</div>
                        </div>
                        <div className="text-xs text-[#cfd4d8]">
                          {regions.length} region
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {regions.length === 0 ? (
                          <span className="text-xs text-[#60656a]">Belum ada region</span>
                        ) : (
                          regions.map((region) => (
                            <span
                              key={region.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-[#2a2a2a] bg-[#151515] text-[#cfd4d8]"
                            >
                              {region.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {data.regions.some((r) => !r.leader_id) && (
                <div className="mt-4 text-xs text-[#9aa0a6]">
                  Ada region tanpa leader.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
            <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222]">
                <h2 className="text-lg font-semibold text-[#e6e6e6]">
                  Performa per Leader
                </h2>
              </div>
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
                        Deal
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
                    {data.leaders.map((l, idx) => (
                      <tr
                        key={l.id}
                        className={`${idx % 2 === 1 ? "bg-[#141414]" : ""} hover:bg-[#1b1b1b]`}
                      >
                        <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                          <div className="font-medium">{l.name}</div>
                          <div className="text-xs text-[#9aa0a6]">{l.code}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                          {l.visit_count}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                          {l.outlet_with_sales_count}
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
                    {data.leaders.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-6 text-center text-sm text-[#9aa0a6]"
                        >
                          Belum ada data leader untuk tanggal ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222]">
                <h2 className="text-lg font-semibold text-[#e6e6e6]">
                  Performa per Wilayah
                </h2>
              </div>
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
                        Deal
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
                    {data.regions.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`${idx % 2 === 1 ? "bg-[#141414]" : ""} hover:bg-[#1b1b1b]`}
                      >
                        <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-[#9aa0a6]">{r.code}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                          {r.visit_count}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                          {r.outlet_with_sales_count}
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
                    {data.regions.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-6 text-center text-sm text-[#9aa0a6]"
                        >
                          Belum ada data wilayah untuk tanggal ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
