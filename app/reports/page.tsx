"use client";

import { useEffect, useState } from "react";

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

interface DailyInsight {
  date: string;
  highlights: string[];
  risks: string[];
  actions: string[];
  notes: string;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [daily, setDaily] = useState<DailyInsight | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const [weekly, setWeekly] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDaily() {
    setDailyLoading(true);
    setDailyError(null);
    try {
      const response = await fetch(`/api/insights/daily?date=${selectedDate}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal mengambil insight harian");
      }
      setDaily(result.data);
    } catch (err) {
      setDailyError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDailyLoading(false);
    }
  }

  useEffect(() => {
    async function fetchWeekly() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/insights/weekly");
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Gagal mengambil laporan mingguan");
        }
        setWeekly(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchWeekly();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <header className="bg-[#111111] border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#e6e6e6]">Laporan</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#e6e6e6]">Insight Harian</h2>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-[#2a2a2a] bg-[#111111] text-[#e6e6e6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#c9f24b] focus:border-[#c9f24b]"
              />
              <button
                onClick={fetchDaily}
                disabled={dailyLoading}
                className="px-4 py-2 bg-[#c9f24b] text-[#1a1a1a] rounded-md text-sm font-medium hover:bg-[#b6e13a] disabled:bg-[#3a3a3a] disabled:text-[#9aa0a6] disabled:cursor-not-allowed"
              >
                {dailyLoading ? "Membuat..." : "Buat Insight"}
              </button>
            </div>
          </div>

          {dailyError ? (
            <div className="bg-[#2a1111] border border-[#5a1d1d] rounded-lg p-4">
              <p className="text-[#ffb3b3]">{dailyError}</p>
            </div>
          ) : daily ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#142010] rounded-lg border border-[#22361a] p-4">
                <h3 className="font-medium text-[#c9f24b] mb-2">Sorotan</h3>
                <ul className="space-y-1 text-sm text-[#cde7a6]">
                  {daily.highlights.map((h, i) => (
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
                  {daily.risks.map((r, i) => (
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
                  {daily.actions.map((a, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">-&gt;</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-[#9aa0a6] text-sm">Klik "Buat Insight" untuk mulai.</p>
          )}
        </div>

        <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#e6e6e6]">Laporan Mingguan</h2>
              {weekly?.period && (
                <p className="text-xs text-[#9aa0a6] mt-1">
                  {weekly.period.from} – {weekly.period.to}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-36">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9f24b]"></div>
            </div>
          ) : error ? (
            <div className="bg-[#2a1111] border border-[#5a1d1d] rounded-lg p-4">
              <p className="text-[#ffb3b3]">{error}</p>
            </div>
          ) : weekly ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#142010] rounded-lg border border-[#22361a] p-4">
                  <h3 className="font-medium text-[#c9f24b] mb-2">Sorotan</h3>
                  <ul className="space-y-1 text-sm text-[#cde7a6]">
                    {weekly.summary.highlights.map((h, i) => (
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
                    {weekly.summary.risks.map((r, i) => (
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
                    {weekly.summary.actions.map((a, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2">-&gt;</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 text-sm text-[#cfd4d8]">
                {weekly.detail}
              </div>
            </div>
          ) : (
            <p className="text-[#9aa0a6] text-sm">Belum ada laporan mingguan.</p>
          )}
        </div>

        <div className="bg-[#151515] rounded-lg border border-[#222222] p-6">
          <h2 className="text-lg font-semibold text-[#e6e6e6] mb-2">
            Laporan Bulanan
          </h2>
          <p className="text-sm text-[#9aa0a6]">
            Coming soon. (Nanti akan ditambahkan setelah weekly stabil.)
          </p>
        </div>
      </main>
    </div>
  );
}
