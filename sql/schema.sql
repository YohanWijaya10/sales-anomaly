-- Sales Visit & Performance Dashboard Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Salesmen table
CREATE TABLE IF NOT EXISTS salesmen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
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

-- ============================================
-- INDEXES
-- ============================================

-- Checkins indexes
CREATE INDEX IF NOT EXISTS idx_checkins_ts ON checkins(ts);
CREATE INDEX IF NOT EXISTS idx_checkins_salesman_ts ON checkins(salesman_id, ts);
CREATE INDEX IF NOT EXISTS idx_checkins_outlet_ts ON checkins(outlet_id, ts);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_ts ON sales(ts);
CREATE INDEX IF NOT EXISTS idx_sales_salesman_ts ON sales(salesman_id, ts);
CREATE INDEX IF NOT EXISTS idx_sales_outlet_ts ON sales(outlet_id, ts);

-- Daily insights cache index
CREATE INDEX IF NOT EXISTS idx_daily_insights_cache_date ON daily_insights_cache(date);
