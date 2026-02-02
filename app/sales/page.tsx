"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SalesmanMetrics {
  salesman_id: string;
  salesman_code: string;
  salesman_name: string;
  visit_count: number;
  unique_outlet_count: number;
  total_sales_amount: number;
  total_sales_qty: number;
  conversion_rate: number;
}

interface DailyData {
  metrics: {
    date: string;
    salesmen_metrics: SalesmanMetrics[];
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

export default function SalesPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [data, setData] = useState<DailyData | null>(null);
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

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#e6e6e6]">Sales</h1>
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
          <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222]">
              <h2 className="text-lg font-semibold text-[#e6e6e6]">Daftar Sales</h2>
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
                  </tr>
                </thead>
                <tbody className="bg-[#151515] divide-y divide-[#222222]">
                  {data.metrics.salesmen_metrics.map((sm) => (
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
