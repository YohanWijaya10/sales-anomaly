"use client";

import { useEffect, useState } from "react";

interface OutletData {
  id: string;
  code: string;
  name: string;
  visit_count: number;
  sales_count: number;
  total_sales_amount: number;
  total_sales_qty: number;
}

interface OutletsResponse {
  date: string;
  period?: { from: string; to: string };
  outlets: OutletData[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function OutletsPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [mode, setMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<OutletsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/analytics/outlets?date=${selectedDate}&mode=${mode}`
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
  }, [selectedDate, mode]);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-[#e6e6e6]">Outlet</h1>
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
          <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222]">
              <h2 className="text-lg font-semibold text-[#e6e6e6]">Daftar Outlet</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#222222]">
                <thead className="bg-[#121212]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                      Kunjungan
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                      Transaksi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                      Nilai Penjualan
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#151515] divide-y divide-[#222222]">
                  {data.outlets.map((o) => (
                    <tr key={o.id} className="hover:bg-[#1b1b1b]">
                      <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                        <div className="font-medium">{o.name}</div>
                        <div className="text-xs text-[#9aa0a6]">{o.code}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                        {o.visit_count}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                        {o.sales_count}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                        {formatCurrency(o.total_sales_amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[#e6e6e6]">
                        {o.total_sales_qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
