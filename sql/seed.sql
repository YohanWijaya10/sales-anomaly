-- Sales Visit & Performance Dashboard Seed Data
-- Run this after schema.sql

-- ============================================
-- CLEAR EXISTING DATA (for reseeding)
-- ============================================
TRUNCATE TABLE daily_insights_cache CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE checkins CASCADE;
TRUNCATE TABLE outlets CASCADE;
TRUNCATE TABLE salesmen CASCADE;

-- ============================================
-- SALESMEN (3 salesmen with different behaviors)
-- ============================================
INSERT INTO salesmen (id, code, name, active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'SM001', 'Andi Pratama', true),       -- Normal performer
  ('22222222-2222-2222-2222-222222222222', 'SM002', 'Budi Santoso', true),       -- Many visits, zero sales (RF_LOW_EFFECTIVENESS)
  ('33333333-3333-3333-3333-333333333333', 'SM003', 'Citra Wulandari', true),    -- Repeated same outlet (RF_LOW_COVERAGE)
  ('44444444-4444-4444-4444-444444444444', 'SM004', 'Dewi Lestari', true),
  ('55555555-5555-5555-5555-555555555555', 'SM005', 'Eko Saputra', true),
  ('66666666-6666-6666-6666-666666666666', 'SM006', 'Farhan Maulana', true);

-- ============================================
-- OUTLETS (10 outlets)
-- ============================================
INSERT INTO outlets (id, code, name, lat, lng) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT001', 'Toko Makmur Jaya', -6.2088, 106.8456),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT002', 'Warung Berkah', -6.2120, 106.8510),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT003', 'Sumber Rezeki', -6.2150, 106.8420),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT004', 'Toko Sentosa', -6.2200, 106.8380),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT005', 'Maju Bersama', -6.2250, 106.8490),
  ('aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT006', 'Abadi Store', -6.2300, 106.8550),
  ('aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT007', 'Harapan Jaya', -6.2350, 106.8400),
  ('aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT008', 'Cahaya Mart', -6.2400, 106.8470),
  ('aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT009', 'Prima Sejahtera', -6.2450, 106.8530),
  ('aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT010', 'Untung Selalu', -6.2500, 106.8600),
  ('aaaaaa11-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT011', 'Sentral Grosir', -6.2070, 106.8525),
  ('aaaaaa12-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT012', 'Bintang Baru', -6.2135, 106.8445),
  ('aaaaaa13-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT013', 'Sinar Jaya', -6.2185, 106.8575),
  ('aaaaaa14-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT014', 'Mitra Usaha', -6.2265, 106.8465),
  ('aaaaaa15-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OUT015', 'Sejahtera Mart', -6.2325, 106.8585);

-- ============================================
-- CHECKINS & SALES DATA (7 days)
-- We'll use CURRENT_DATE - interval to create relative dates
-- ============================================

-- Helper: Get dates for the past 7 days
-- Day 1 = CURRENT_DATE - 6 days (oldest)
-- Day 7 = CURRENT_DATE (today)

-- ============================================
-- ALICE (SM001) - NORMAL PERFORMER
-- Good conversion rate, varied outlets
-- ============================================

-- Day 1 (6 days ago)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '09:00', -6.2088, 106.8456, 'Morning visit'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '10:30', -6.2120, 106.8510, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '11:45', -6.2150, 106.8420, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '14:00', -6.2200, 106.8380, 'After lunch'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '15:30', -6.2250, 106.8490, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '09:15', 1500000, 30, 'INV-001-001'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '12:00', 2200000, 45, 'INV-001-002'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '15:45', 800000, 15, 'INV-001-003');

-- Day 2 (5 days ago)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '09:30', -6.2300, 106.8550, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '11:00', -6.2350, 106.8400, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '13:30', -6.2400, 106.8470, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '15:00', -6.2450, 106.8530, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '09:45', 1800000, 35, 'INV-001-004'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '14:00', 950000, 20, 'INV-001-005');

-- Day 3 (4 days ago)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '09:00', -6.2088, 106.8456, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '10:30', -6.2120, 106.8510, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '12:00', -6.2500, 106.8600, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '14:30', -6.2200, 106.8380, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '16:00', -6.2250, 106.8490, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '09:20', 1200000, 25, 'INV-001-006'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '12:30', 3500000, 70, 'INV-001-007'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '16:15', 1100000, 22, 'INV-001-008');

-- Day 4 (3 days ago)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '09:00', -6.2150, 106.8420, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '10:30', -6.2300, 106.8550, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '13:00', -6.2350, 106.8400, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '15:00', -6.2450, 106.8530, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '09:30', 1650000, 33, 'INV-001-009'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '13:30', 2100000, 42, 'INV-001-010');

-- Day 5 (2 days ago)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '09:00', -6.2120, 106.8510, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '10:30', -6.2200, 106.8380, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '12:00', -6.2400, 106.8470, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '14:30', -6.2500, 106.8600, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '16:00', -6.2088, 106.8456, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '09:20', 1350000, 27, 'INV-001-011'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '12:30', 2800000, 56, 'INV-001-012'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '16:20', 750000, 15, 'INV-001-013');

-- Day 6 (1 day ago / yesterday)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '09:00', -6.2250, 106.8490, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '10:30', -6.2300, 106.8550, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '13:00', -6.2450, 106.8530, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '15:00', -6.2150, 106.8420, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '09:20', 1950000, 39, 'INV-001-014'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '13:30', 1400000, 28, 'INV-001-015');

-- Day 7 (today)
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '09:00', -6.2350, 106.8400, 'First visit today'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '10:30', -6.2200, 106.8380, NULL),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '12:00', -6.2120, 106.8510, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '09:20', 2500000, 50, 'INV-001-016'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '12:15', 1100000, 22, 'INV-001-017');

-- ============================================
-- BOB (SM002) - LOW EFFECTIVENESS
-- Many visits to different outlets but ZERO sales
-- Triggers RF_LOW_EFFECTIVENESS
-- ============================================

-- Day 1 (6 days ago) - 6 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '08:30', -6.2088, 106.8456, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '09:30', -6.2120, 106.8510, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '10:30', -6.2150, 106.8420, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '13:00', -6.2200, 106.8380, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '14:30', -6.2250, 106.8490, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '16:00', -6.2300, 106.8550, NULL);
-- No sales for Bob on Day 1

-- Day 2 (5 days ago) - 5 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '09:00', -6.2350, 106.8400, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '10:30', -6.2400, 106.8470, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '12:00', -6.2450, 106.8530, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '14:00', -6.2500, 106.8600, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '16:00', -6.2088, 106.8456, NULL);
-- No sales for Bob on Day 2

-- Day 3 (4 days ago) - 7 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '08:30', -6.2120, 106.8510, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '09:30', -6.2150, 106.8420, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '10:30', -6.2200, 106.8380, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '12:00', -6.2250, 106.8490, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '13:30', -6.2300, 106.8550, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '15:00', -6.2350, 106.8400, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '16:30', -6.2400, 106.8470, NULL);
-- No sales for Bob on Day 3

-- Day 4 (3 days ago) - 5 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '09:00', -6.2450, 106.8530, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '10:30', -6.2500, 106.8600, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '12:00', -6.2088, 106.8456, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '14:00', -6.2120, 106.8510, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '16:00', -6.2150, 106.8420, NULL);
-- No sales for Bob on Day 4

-- Day 5 (2 days ago) - 6 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '08:30', -6.2200, 106.8380, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '10:00', -6.2250, 106.8490, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '11:30', -6.2300, 106.8550, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '13:30', -6.2350, 106.8400, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '15:00', -6.2400, 106.8470, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '16:30', -6.2450, 106.8530, NULL);
-- No sales for Bob on Day 5

-- Day 6 (1 day ago) - 5 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaa10-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '09:00', -6.2500, 106.8600, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '10:30', -6.2088, 106.8456, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '12:00', -6.2120, 106.8510, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '14:00', -6.2150, 106.8420, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '16:00', -6.2200, 106.8380, NULL);
-- No sales for Bob on Day 6

-- Day 7 (today) - 5 visits, 0 sales
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '08:30', -6.2250, 106.8490, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '09:30', -6.2300, 106.8550, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '10:30', -6.2350, 106.8400, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '12:00', -6.2400, 106.8470, NULL),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '13:30', -6.2450, 106.8530, NULL);
-- No sales for Bob on Day 7

-- ============================================
-- CHARLIE (SM003) - LOW COVERAGE & TOO CONSISTENT
-- Many visits but always to same 1-2 outlets
-- ALSO: Exactly 5 visits every day for 7 days (too consistent)
-- Triggers RF_LOW_COVERAGE and RF_TOO_CONSISTENT_7D
-- ============================================

-- Day 1 (6 days ago) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '09:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '10:30', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '12:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '14:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '16:00', -6.2120, 106.8510, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '6 days' + TIME '09:30', 500000, 10, 'INV-003-001');

-- Day 2 (5 days ago) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '09:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '10:30', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '12:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '14:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '16:00', -6.2088, 106.8456, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '5 days' + TIME '10:45', 350000, 7, 'INV-003-002');

-- Day 3 (4 days ago) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '09:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '10:30', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '12:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '14:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '16:00', -6.2088, 106.8456, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '4 days' + TIME '12:30', 420000, 8, 'INV-003-003');

-- Day 4 (3 days ago) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '09:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '10:30', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '12:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '14:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '16:00', -6.2088, 106.8456, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '3 days' + TIME '14:30', 380000, 7, 'INV-003-004');

-- Day 5 (2 days ago) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '09:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '10:30', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '12:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '14:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '16:00', -6.2088, 106.8456, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days' + TIME '16:30', 550000, 11, 'INV-003-005');

-- Day 6 (1 day ago) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '09:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '10:30', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '12:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '14:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '16:00', -6.2120, 106.8510, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day' + TIME '14:30', 480000, 9, 'INV-003-006');

-- Day 7 (today) - 5 visits to same 2 outlets
INSERT INTO checkins (salesman_id, outlet_id, ts, lat, lng, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '09:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '10:30', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '12:00', -6.2120, 106.8510, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '14:00', -6.2088, 106.8456, NULL),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '15:30', -6.2120, 106.8510, NULL);

INSERT INTO sales (salesman_id, outlet_id, ts, amount, qty, invoice_no) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + TIME '12:15', 400000, 8, 'INV-003-007');
