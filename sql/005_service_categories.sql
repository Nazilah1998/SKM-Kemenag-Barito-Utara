-- ============================================================
-- SIKAP - Migration 005: Service Categories Table
-- ============================================================

CREATE TABLE IF NOT EXISTS kemenag_survey.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO kemenag_survey.service_categories (name, sort_order) VALUES
  ('Layanan Tata Usaha', 1),
  ('Layanan Bimbingan Masyarakat Islam', 2),
  ('Layanan Pendidikan Madrasah', 3),
  ('Layanan Pendidikan Diniyah dan Pondok Pesantren', 4),
  ('Layanan Pendidikan Agama Islam', 5),
  ('Layanan Bimbingan Masyarakat Kristen', 6),
  ('Layanan Penyelenggara Zakat dan Wakaf', 7),
  ('Layanan Penyelenggara Hindu', 8)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE kemenag_survey.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select service_categories" ON kemenag_survey.service_categories
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated all service_categories" ON kemenag_survey.service_categories
  FOR ALL TO authenticated USING (true);
