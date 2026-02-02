"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type DailyDetail = {
  date: string;
  salesman: { id: string; code: string; name: string };
  totals: {
    total_checkins: number;
    total_sales: number;
    total_sales_amount: number;
    total_sales_qty: number;
  };
  checkins: Array<{
    id: string;
    ts: string;
    lat: number | null;
    lng: number | null;
    notes: string | null;
    outlet_id: string | null;
    outlet_code: string | null;
    outlet_name: string | null;
  }>;
  sales: Array<{
    id: string;
    ts: string;
    amount: number;
    qty: number;
    invoice_no: string | null;
    outlet_id: string | null;
    outlet_code: string | null;
    outlet_name: string | null;
  }>;
};

function formatTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SalesmanDailyDetailPage() {
  const params = useParams<{ salesId?: string | string[]; date?: string | string[] }>();
  const salesIdParam = params?.salesId;
  const dateParam = params?.date;
  const salesId = Array.isArray(salesIdParam) ? salesIdParam[0] : salesIdParam;
  const date = Array.isArray(dateParam) ? dateParam[0] : dateParam;

  const [data, setData] = useState<DailyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);

      if (!salesId || !date) {
        setError("Parameter tidak valid");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/analytics/salesman/day?salesman_id=${salesId}&date=${date}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Gagal mengambil detail harian");
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [salesId, date]);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/sales/${salesId ?? ""}`}
                className="text-[#c9f24b] hover:underline flex items-center gap-1"
              >
                <span>&larr;</span> Kembali
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#e6e6e6]">
                  {data?.salesman?.name || "Detail Harian"}
                </h1>
                <p className="text-sm text-[#9aa0a6]">
                  {data?.salesman?.code ? `${data.salesman.code} • ` : ""}
                  {date || ""}
                </p>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Kunjungan</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.totals.total_checkins}
                </p>
              </div>
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Total Transaksi</h3>
                <p className="text-3xl font-bold text-[#e6e6e6] mt-2">
                  {data.totals.total_sales}
                </p>
              </div>
              <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
                <h3 className="text-sm font-medium text-[#9aa0a6]">Nilai Penjualan</h3>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#222222]">
                  <h2 className="text-lg font-semibold text-[#e6e6e6]">
                    Kunjungan ({data.checkins.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#222222]">
                    <thead className="bg-[#121212]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Jam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Outlet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Catatan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Lokasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#151515] divide-y divide-[#222222]">
                      {data.checkins.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-6 text-center text-sm text-[#9aa0a6]"
                          >
                            Tidak ada kunjungan
                          </td>
                        </tr>
                      ) : (
                        data.checkins.map((c) => (
                          <tr key={c.id} className="hover:bg-[#1b1b1b]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e6e6e6]">
                              {formatTime(c.ts)}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                              <div className="font-medium">
                                {c.outlet_name || "Outlet tidak diketahui"}
                              </div>
                              {c.outlet_code && (
                                <div className="text-xs text-[#9aa0a6]">{c.outlet_code}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#cfd4d8]">
                              {c.notes || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#cfd4d8]">
                              {c.lat != null && c.lng != null
                                ? `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#151515] rounded-lg border border-[#222222] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#222222]">
                  <h2 className="text-lg font-semibold text-[#e6e6e6]">
                    Transaksi ({data.sales.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#222222]">
                    <thead className="bg-[#121212]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Jam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Outlet
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Nilai
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#151515] divide-y divide-[#222222]">
                      {data.sales.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-6 text-center text-sm text-[#9aa0a6]"
                          >
                            Tidak ada transaksi
                          </td>
                        </tr>
                      ) : (
                        data.sales.map((s) => (
                          <tr key={s.id} className="hover:bg-[#1b1b1b]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e6e6e6]">
                              {formatTime(s.ts)}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#e6e6e6]">
                              <div className="font-medium">
                                {s.outlet_name || "Outlet tidak diketahui"}
                              </div>
                              {s.outlet_code && (
                                <div className="text-xs text-[#9aa0a6]">{s.outlet_code}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                              {formatCurrency(Number(s.amount || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#e6e6e6]">
                              {s.qty}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#cfd4d8]">
                              {s.invoice_no || "-"}
                            </td>
                          </tr>
                        ))
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
