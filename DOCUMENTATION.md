# Sales Dashboard Documentation

Dokumen ini menjelaskan aplikasi, fitur, alur data, rumus perhitungan, dan API yang tersedia.

## Ringkasan Aplikasi
Aplikasi ini adalah dashboard untuk memantau kunjungan sales, performa penjualan, dan insight harian/mingguan.
Fokus utama: aktivitas kunjungan (check-in), penjualan (sales), dan anomali perilaku (red flags).

## Fitur Utama
- **Dashboard Harian**
  - Ringkasan total kunjungan, penjualan, dan konversi.
  - Ranking sales (top/bottom) berdasarkan konversi, sales, dan kunjungan.
  - Red flags/anomali per sales.
  - Analitik leader dan region.
- **Analitik Outlet Harian**
  - Kunjungan dan penjualan per outlet.
- **Detail Sales**
  - Rangkuman performa per sales dalam rentang tanggal.
  - Detail harian check-in dan sales untuk sales tertentu.
- **Insight Otomatis**
  - Insight harian dan mingguan.
  - Jika `DEEPSEEK_API_KEY` tersedia, insight dibuat oleh LLM.
  - Jika tidak, gunakan fallback deterministic.
- **Ingest Data**
  - Endpoint untuk check-in dan sales.
  - Auto-upsert salesman dan outlet bila belum ada.

## Arsitektur & Teknologi
- **Frontend**: Next.js (App Router)
- **Backend**: Next.js API Routes
- **Database**: Postgres (Neon)
- **LLM (opsional)**: DeepSeek

## Struktur Data (Ringkas)
Sumber: `sales-dashboard/sql/schema.sql`

### Tabel Inti
- `leaders`: data pimpinan
- `regions`: wilayah
- `salesmen`: data sales
- `outlets`: data outlet (lat/lng tersedia)
- `checkins`: kunjungan sales ke outlet
- `sales`: data penjualan

### Tabel Cache Insight
- `daily_insights_cache`
- `weekly_insights_cache`

## Rumus & Perhitungan Utama
Sumber: `sales-dashboard/lib/analytics/computeDailyMetrics.ts`

### Per Sales (per hari)
- **visit_count** = jumlah `checkins` sales di tanggal itu.
- **unique_outlet_count** = jumlah outlet unik dari checkins.
- **total_sales_amount** = total `amount` dari `sales` di tanggal itu.
- **total_sales_qty** = total `qty` dari `sales` di tanggal itu.
- **outlet_with_sales_count** = jumlah outlet unik yang punya penjualan `amount > 0`.
- **conversion_rate** = `outlet_with_sales_count / visit_count`.
  - Jika `visit_count = 0`, hasil 0.

### Agregat Harian
- **total_visits** = sum `visit_count` semua sales.
- **total_sales_amount** = sum `total_sales_amount` semua sales.
- **total_sales_qty** = sum `total_sales_qty` semua sales.
- **avg_conversion_rate** = rata-rata `conversion_rate` hanya untuk sales yang punya `visit_count > 0`.

### Agregat Per Sales (range tanggal)
Sumber: `computeMetricsForSalesman`
- **total_visits** = sum `visit_count` harian.
- **total_unique_outlets** = nilai maksimum `unique_outlet_count` harian di rentang (bukan sum).
- **total_sales_amount** = sum `total_sales_amount` harian.
- **total_sales_qty** = sum `total_sales_qty` harian.
- **avg_conversion_rate** = rata-rata `conversion_rate` pada hari yang punya visit.

## Red Flags (Anomali)
Sumber: `sales-dashboard/lib/analytics/redFlags.ts`

- **RF_LOW_EFFECTIVENESS (high)**
  - Kondisi: `unique_outlet_count >= 5` dan `total_sales_amount = 0`.
- **RF_LOW_COVERAGE (medium)**
  - Kondisi: `visit_count >= 8` dan `unique_outlet_count <= 2`.
- **RF_TOO_CONSISTENT_7D (medium)**
  - Kondisi: dalam 7 hari terakhir, jumlah visit per hari sama semua dan `>= 5`.

## Insight Harian dan Mingguan
Sumber: `sales-dashboard/app/api/insights/*` dan `sales-dashboard/lib/deepseek/client.ts`

- Jika `DEEPSEEK_API_KEY` tersedia, insight akan di-generate oleh DeepSeek.
- Jika tidak, gunakan fallback deterministic.
- Hasil insight di-cache di tabel `daily_insights_cache` dan `weekly_insights_cache`.

## Endpoint API
Base: `/api`

### Analytics
- `GET /api/analytics/daily?date=YYYY-MM-DD`
  - Ringkasan harian + red flags + ranking.
- `GET /api/analytics/outlets?date=YYYY-MM-DD`
  - Statistik per outlet (kunjungan, sales, qty).
- `GET /api/analytics/leader-region?date=YYYY-MM-DD`
  - Statistik per leader dan region.
- `GET /api/analytics/salesman?salesman_id=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Statistik per sales untuk range tanggal + riwayat red flags.
- `GET /api/analytics/salesman/day?salesman_id=UUID&date=YYYY-MM-DD`
  - Detail check-in dan sales per hari untuk sales tertentu.

### Insight
- `GET /api/insights/daily?date=YYYY-MM-DD`
  - Insight harian (LLM/fallback), plus cache.
- `GET /api/insights/weekly`
  - Insight mingguan untuk **minggu lengkap Senin–Minggu**.
  - Jika minggu berjalan belum lengkap, otomatis pakai minggu sebelumnya.

### Ingest
- `POST /api/ingest/checkin`
  - Body:
    - `salesman_code` (string)
    - `salesman_name` (string, optional jika sales baru)
    - `outlet_code` (string)
    - `outlet_name` (string, optional jika outlet baru)
    - `ts` (ISO datetime)
    - `lat` (number, optional)
    - `lng` (number, optional)
    - `notes` (string, optional)
  - Auto-upsert salesman & outlet.
- `POST /api/ingest/sale`
  - Body:
    - `salesman_code` (string)
    - `salesman_name` (string, optional jika sales baru)
    - `outlet_code` (string)
    - `outlet_name` (string, optional jika outlet baru)
    - `ts` (ISO datetime)
    - `amount` (number)
    - `qty` (number)
    - `invoice_no` (string, optional)
  - Auto-upsert salesman & outlet.

## Seed Data
- Script seed: `sales-dashboard/scripts/seed.ts`
- Seed data: leaders, regions, salesmen, outlets, checkins, sales.
- Outlet di seed sudah punya `lat` dan `lng`.
- Seed tanggal diset via `SEED_BASE_DATE` (saat ini: `2026-02-05`).

Cara menjalankan:
```bash
cd /Users/yohanwijaya/Desktop/WORK/Anomali Sales/sales-dashboard
npm run seed
```
Catatan: seed akan `TRUNCATE` semua data sebelum insert ulang.

## Environment Variables
- `DATABASE_URL` (wajib) untuk koneksi Neon/Postgres.
- `DEEPSEEK_API_KEY` (opsional) untuk insight LLM.
- `DEEPSEEK_BASE_URL` (opsional) default `https://api.deepseek.com/v1`.

## Halaman UI
- `/dashboard` -> ringkasan harian + insight mingguan + leader/region.
- `/sales` -> daftar sales.
- `/outlets` -> daftar outlet.
- `/leader-region` -> leaderboard leader & region.
- `/reports` -> laporan.

## Catatan Implementasi
- Filter tanggal menggunakan range `YYYY-MM-DDT00:00:00.000Z` s/d `YYYY-MM-DDT23:59:59.999Z`.
- Konversi dihitung berdasarkan outlet unik (bukan jumlah check-in).
- Insight mingguan berdasarkan 7 hari terakhir dari server time.
