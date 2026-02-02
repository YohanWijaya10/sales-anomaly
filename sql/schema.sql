-- Sales Visit & Performance Dashboard Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Leaders table
CREATE TABLE IF NOT EXISTS leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES leaders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Salesmen table
CREATE TABLE IF NOT EXISTS salesmen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES leaders(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outlets table
CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Checkins table
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesman_id UUID REFERENCES salesmen(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES leaders(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
  ts TIMESTAMPTZ NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesman_id UUID REFERENCES salesmen(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES leaders(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
  ts TIMESTAMPTZ NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  qty NUMERIC NOT NULL DEFAULT 0,
  invoice_no TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily insights cache table
CREATE TABLE IF NOT EXISTS daily_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly insights cache table
CREATE TABLE IF NOT EXISTS weekly_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (period_from, period_to)
);

-- ============================================
-- INDEXES
-- ============================================

-- Ensure new columns exist when table was created before leaders/regions
ALTER TABLE salesmen
  ADD COLUMN IF NOT EXISTS leader_id UUID,
  ADD COLUMN IF NOT EXISTS region_id UUID;

ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS leader_id UUID,
  ADD COLUMN IF NOT EXISTS region_id UUID;

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS leader_id UUID,
  ADD COLUMN IF NOT EXISTS region_id UUID;

-- Leaders/regions indexes
CREATE INDEX IF NOT EXISTS idx_regions_leader_id ON regions(leader_id);
CREATE INDEX IF NOT EXISTS idx_salesmen_leader_id ON salesmen(leader_id);
CREATE INDEX IF NOT EXISTS idx_salesmen_region_id ON salesmen(region_id);

-- Checkins indexes
CREATE INDEX IF NOT EXISTS idx_checkins_ts ON checkins(ts);
CREATE INDEX IF NOT EXISTS idx_checkins_salesman_ts ON checkins(salesman_id, ts);
CREATE INDEX IF NOT EXISTS idx_checkins_outlet_ts ON checkins(outlet_id, ts);
CREATE INDEX IF NOT EXISTS idx_checkins_leader_id ON checkins(leader_id);
CREATE INDEX IF NOT EXISTS idx_checkins_region_id ON checkins(region_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_ts ON sales(ts);
CREATE INDEX IF NOT EXISTS idx_sales_salesman_ts ON sales(salesman_id, ts);
CREATE INDEX IF NOT EXISTS idx_sales_outlet_ts ON sales(outlet_id, ts);
CREATE INDEX IF NOT EXISTS idx_sales_leader_id ON sales(leader_id);
CREATE INDEX IF NOT EXISTS idx_sales_region_id ON sales(region_id);

-- Daily insights cache index
CREATE INDEX IF NOT EXISTS idx_daily_insights_cache_date ON daily_insights_cache(date);
CREATE INDEX IF NOT EXISTS idx_weekly_insights_cache_period ON weekly_insights_cache(period_from, period_to);
