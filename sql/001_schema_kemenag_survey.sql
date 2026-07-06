-- ============================================================
-- SIKAP - Schema: kemenag_survey
-- Migration 001: Full schema creation
-- ============================================================

CREATE SCHEMA IF NOT EXISTS kemenag_survey;

-- 6.1 services
CREATE TABLE kemenag_survey.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.2 survey_periods
CREATE TYPE kemenag_survey.period_type AS ENUM ('triwulan', 'semester', 'tahunan');

CREATE TABLE kemenag_survey.survey_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type kemenag_survey.period_type NOT NULL,
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6.3 unsur
CREATE TYPE kemenag_survey.index_type AS ENUM ('IPKP', 'IPAK');

CREATE TABLE kemenag_survey.unsur (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_type kemenag_survey.index_type NOT NULL,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.4 questions
CREATE TYPE kemenag_survey.input_type AS ENUM ('star_rating');

CREATE TABLE kemenag_survey.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unsur_id uuid NOT NULL REFERENCES kemenag_survey.unsur(id) ON DELETE CASCADE,
  service_id uuid REFERENCES kemenag_survey.services(id) ON DELETE SET NULL,
  question_text_id text NOT NULL,
  question_text_en text NOT NULL,
  input_type kemenag_survey.input_type NOT NULL DEFAULT 'star_rating',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.5 demographic_fields
CREATE TYPE kemenag_survey.field_type AS ENUM ('select', 'text', 'number');

CREATE TABLE kemenag_survey.demographic_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  label_id text NOT NULL,
  label_en text NOT NULL,
  field_type kemenag_survey.field_type NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.6 demographic_options
CREATE TABLE kemenag_survey.demographic_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES kemenag_survey.demographic_fields(id) ON DELETE CASCADE,
  value text NOT NULL,
  label_id text NOT NULL,
  label_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

-- 6.7 responses
CREATE TABLE kemenag_survey.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES kemenag_survey.services(id),
  period_id uuid NOT NULL REFERENCES kemenag_survey.survey_periods(id),
  is_anonymous boolean NOT NULL DEFAULT true,
  respondent_name text,
  respondent_contact text,
  locale text NOT NULL DEFAULT 'id',
  turnstile_verified boolean NOT NULL DEFAULT false,
  ip_address inet,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- 6.8 response_demographics
CREATE TABLE kemenag_survey.response_demographics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES kemenag_survey.responses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES kemenag_survey.demographic_fields(id) ON DELETE SET NULL,
  value text NOT NULL
);

-- 6.9 response_answers
CREATE TABLE kemenag_survey.response_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES kemenag_survey.responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES kemenag_survey.questions(id) ON DELETE SET NULL,
  unsur_id uuid NOT NULL REFERENCES kemenag_survey.unsur(id) ON DELETE SET NULL,
  rating_value smallint NOT NULL CHECK (rating_value >= 1 AND rating_value <= 4)
);

-- 6.10 app_settings
CREATE TABLE kemenag_survey.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default app_settings
INSERT INTO kemenag_survey.app_settings (key, value) VALUES
  ('site_name', 'SIKAP - Survei Kepuasan Masyarakat'),
  ('site_name_en', 'SIKAP - Public Satisfaction Survey'),
  ('logo_url', ''),
  ('turnstile_site_key', ''),
  ('turnstile_secret_key', '')
ON CONFLICT (key) DO NOTHING;

-- Seed default demographic fields
INSERT INTO kemenag_survey.demographic_fields (field_key, label_id, label_en, field_type, is_required, sort_order) VALUES
  ('jenis_kelamin', 'Jenis Kelamin', 'Gender', 'select', true, 1),
  ('usia', 'Usia', 'Age', 'select', true, 2),
  ('pendidikan', 'Pendidikan Terakhir', 'Education', 'select', true, 3),
  ('pekerjaan', 'Pekerjaan', 'Occupation', 'select', true, 4)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO kemenag_survey.demographic_options (field_id, value, label_id, label_en, sort_order)
SELECT id, 'Laki-laki', 'Laki-laki', 'Male', 1 FROM kemenag_survey.demographic_fields WHERE field_key = 'jenis_kelamin'
UNION ALL
SELECT id, 'Perempuan', 'Perempuan', 'Female', 2 FROM kemenag_survey.demographic_fields WHERE field_key = 'jenis_kelamin';

INSERT INTO kemenag_survey.demographic_options (field_id, value, label_id, label_en, sort_order)
SELECT id, '17-25', '17 - 25 Tahun', '17 - 25 Years', 1 FROM kemenag_survey.demographic_fields WHERE field_key = 'usia'
UNION ALL
SELECT id, '26-35', '26 - 35 Tahun', '26 - 35 Years', 2 FROM kemenag_survey.demographic_fields WHERE field_key = 'usia'
UNION ALL
SELECT id, '36-45', '36 - 45 Tahun', '36 - 45 Years', 3 FROM kemenag_survey.demographic_fields WHERE field_key = 'usia'
UNION ALL
SELECT id, '46-55', '46 - 55 Tahun', '46 - 55 Years', 4 FROM kemenag_survey.demographic_fields WHERE field_key = 'usia'
UNION ALL
SELECT id, '56+', '56 Tahun ke Atas', '56 Years & Above', 5 FROM kemenag_survey.demographic_fields WHERE field_key = 'usia';

INSERT INTO kemenag_survey.demographic_options (field_id, value, label_id, label_en, sort_order)
SELECT id, 'SD', 'SD/Sederajat', 'Elementary School', 1 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan'
UNION ALL
SELECT id, 'SMP', 'SMP/Sederajat', 'Middle School', 2 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan'
UNION ALL
SELECT id, 'SMA', 'SMA/Sederajat', 'High School', 3 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan'
UNION ALL
SELECT id, 'D3', 'D3', 'Diploma (D3)', 4 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan'
UNION ALL
SELECT id, 'S1', 'S1', 'Bachelor (S1)', 5 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan'
UNION ALL
SELECT id, 'S2', 'S2', 'Master (S2)', 6 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan'
UNION ALL
SELECT id, 'S3', 'S3', 'Doctorate (S3)', 7 FROM kemenag_survey.demographic_fields WHERE field_key = 'pendidikan';

INSERT INTO kemenag_survey.demographic_options (field_id, value, label_id, label_en, sort_order)
SELECT id, 'PNS', 'PNS', 'Civil Servant', 1 FROM kemenag_survey.demographic_fields WHERE field_key = 'pekerjaan'
UNION ALL
SELECT id, 'PPPK', 'PPPK', 'PPPK', 2 FROM kemenag_survey.demographic_fields WHERE field_key = 'pekerjaan'
UNION ALL
SELECT id, 'TNI/Polri', 'TNI/Polri', 'Military/Police', 3 FROM kemenag_survey.demographic_fields WHERE field_key = 'pekerjaan'
UNION ALL
SELECT id, 'Swasta', 'Swasta', 'Private Employee', 4 FROM kemenag_survey.demographic_fields WHERE field_key = 'pekerjaan'
UNION ALL
SELECT id, 'Wiraswasta', 'Wiraswasta', 'Entrepreneur', 5 FROM kemenag_survey.demographic_fields WHERE field_key = 'pekerjaan'
UNION ALL
SELECT id, 'Lainnya', 'Lainnya', 'Other', 6 FROM kemenag_survey.demographic_fields WHERE field_key = 'pekerjaan';

-- Seed default unsur IPKP (9 unsur sesuai Permenpan)
INSERT INTO kemenag_survey.unsur (index_type, name, description, sort_order) VALUES
  ('IPKP', 'Persyaratan', 'Kesesuaian persyaratan dengan jenis pelayanan', 1),
  ('IPKP', 'Sistem, Mekanisme, dan Prosedur', 'Kemudahan prosedur pelayanan', 2),
  ('IPKP', 'Waktu Penyelesaian', 'Kecepatan waktu pelayanan', 3),
  ('IPKP', 'Biaya/Tarif', 'Kewajaran biaya pelayanan', 4),
  ('IPKP', 'Produk Spesifikasi Jenis Pelayanan', 'Kesesuaian hasil pelayanan', 5),
  ('IPKP', 'Kompetensi Pelaksana', 'Kemampuan petugas dalam memberikan pelayanan', 6),
  ('IPKP', 'Perilaku Pelaksana', 'Sikap dan perilaku petugas', 7),
  ('IPKP', 'Penanganan Pengaduan, Saran dan Masukan', 'Mekanisme pengaduan', 8),
  ('IPKP', 'Sarana dan Prasarana', 'Kenyamanan fasilitas pelayanan', 9);

-- Seed default unsur IPAK (5 unsur sesuai Permenpan)
INSERT INTO kemenag_survey.unsur (index_type, name, description, sort_order) VALUES
  ('IPAK', 'Percaloan/Perantara Tidak Resmi', 'Ada tidaknya perantara tidak resmi', 1),
  ('IPAK', 'Pungutan Liar (Pungli)', 'Ada tidaknya pungutan di luar ketentuan', 2),
  ('IPAK', 'Pemberian Imbalan/ Gratifikasi', 'Ada tidaknya permintaan imbalan', 3),
  ('IPAK', 'Diskriminasi Pelayanan', 'Ada tidaknya perlakuan berbeda', 4),
  ('IPAK', 'Praktek Suap/Korupsi', 'Ada tidaknya praktik suap', 5);

-- Seed default questions for each IPKP unsur
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT * FROM kemenag_survey.unsur WHERE index_type = 'IPKP' LOOP
    INSERT INTO kemenag_survey.questions (unsur_id, question_text_id, question_text_en, sort_order) VALUES
      (u.id,
       'Bagaimana pendapat Saudara tentang kesesuaian persyaratan dengan jenis pelayanan yang diberikan?',
       'What is your opinion on the suitability of requirements for the type of service provided?',
       1);
  END LOOP;
END $$;

-- Seed default questions for each IPAK unsur
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT * FROM kemenag_survey.unsur WHERE index_type = 'IPAK' LOOP
    INSERT INTO kemenag_survey.questions (unsur_id, question_text_id, question_text_en, sort_order) VALUES
      (u.id,
       'Apakah Saudara menemukan adanya praktek percaloan/perantara tidak resmi dalam pelayanan ini?',
       'Did you find any unofficial intermediary practices in this service?',
       1);
  END LOOP;
END $$;

-- ============================================================
-- VIEW: kemenag_survey.vw_index_calculation
-- Calculates IPKP and IPAK indexes dynamically
-- ============================================================

CREATE OR REPLACE VIEW kemenag_survey.vw_index_summary AS
WITH aktif_unsur AS (
  SELECT index_type, COUNT(*) as total_unsur
  FROM kemenag_survey.unsur
  WHERE is_active = true
  GROUP BY index_type
),
nrr_per_unsur AS (
  SELECT
    ra.unsur_id,
    u.index_type,
    u.name AS unsur_name,
    u.sort_order,
    AVG(ra.rating_value::numeric) AS nrr
  FROM kemenag_survey.response_answers ra
  JOIN kemenag_survey.unsur u ON u.id = ra.unsur_id
  WHERE u.is_active = true
  GROUP BY ra.unsur_id, u.index_type, u.name, u.sort_order
),
nrr_tertimbang AS (
  SELECT
    n.*,
    au.total_unsur,
    (1.0 / au.total_unsur) AS bobot,
    (n.nrr * (1.0 / au.total_unsur)) AS nrr_tertimbang
  FROM nrr_per_unsur n
  JOIN aktif_unsur au ON au.index_type = n.index_type
),
index_aggregate AS (
  SELECT
    index_type,
    SUM(nrr_tertimbang) AS nilai_index,
    SUM(nrr_tertimbang) * 25 AS nilai_konversi
  FROM nrr_tertimbang
  GROUP BY index_type
)
SELECT
  ia.index_type,
  ROUND(ia.nilai_index::numeric, 4) AS nilai_index,
  ROUND(ia.nilai_konversi::numeric, 2) AS nilai_konversi,
  CASE
    WHEN ia.nilai_konversi BETWEEN 88.31 AND 100.00 THEN 'A'
    WHEN ia.nilai_konversi BETWEEN 76.61 AND 88.30 THEN 'B'
    WHEN ia.nilai_konversi BETWEEN 65.00 AND 76.60 THEN 'C'
    ELSE 'D'
  END AS mutu,
  CASE
    WHEN ia.nilai_konversi BETWEEN 88.31 AND 100.00 THEN 'Sangat Baik'
    WHEN ia.nilai_konversi BETWEEN 76.61 AND 88.30 THEN 'Baik'
    WHEN ia.nilai_konversi BETWEEN 65.00 AND 76.60 THEN 'Kurang Baik'
    ELSE 'Tidak Baik'
  END AS kinerja,
  ia.nilai_konversi AS mutu_en,
  NOW() AS calculated_at
FROM index_aggregate ia;

-- ============================================================
-- VIEW: kemenag_survey.vw_index_summary_by_service
-- ============================================================

CREATE OR REPLACE VIEW kemenag_survey.vw_index_summary_by_service AS
WITH per_service AS (
  SELECT
    r.service_id,
    ra.unsur_id,
    u.index_type,
    AVG(ra.rating_value::numeric) AS avg_rating
  FROM kemenag_survey.responses r
  JOIN kemenag_survey.response_answers ra ON ra.response_id = r.id
  JOIN kemenag_survey.unsur u ON u.id = ra.unsur_id
  WHERE u.is_active = true
  GROUP BY r.service_id, ra.unsur_id, u.index_type
),
aktif_unsur AS (
  SELECT index_type, COUNT(*) as total_unsur
  FROM kemenag_survey.unsur WHERE is_active = true
  GROUP BY index_type
),
tertimbang AS (
  SELECT
    ps.service_id,
    ps.index_type,
    ps.avg_rating,
    au.total_unsur,
    (ps.avg_rating / au.total_unsur) AS weighted
  FROM per_service ps
  JOIN aktif_unsur au ON au.index_type = ps.index_type
)
SELECT
  t.service_id,
  s.name AS service_name,
  t.index_type,
  ROUND(SUM(t.weighted)::numeric, 4) AS nilai_index,
  ROUND((SUM(t.weighted) * 25)::numeric, 2) AS nilai_konversi,
  CASE
    WHEN (SUM(t.weighted) * 25) BETWEEN 88.31 AND 100.00 THEN 'A'
    WHEN (SUM(t.weighted) * 25) BETWEEN 76.61 AND 88.30 THEN 'B'
    WHEN (SUM(t.weighted) * 25) BETWEEN 65.00 AND 76.60 THEN 'C'
    ELSE 'D'
  END AS mutu
FROM tertimbang t
JOIN kemenag_survey.services s ON s.id = t.service_id
GROUP BY t.service_id, s.name, t.index_type;

-- ============================================================
-- VIEW: kemenag_survey.vw_index_trend
-- ============================================================

CREATE OR REPLACE VIEW kemenag_survey.vw_index_trend AS
WITH monthly AS (
  SELECT
    date_trunc('month', r.submitted_at) AS bulan,
    ra.unsur_id,
    u.index_type,
    AVG(ra.rating_value::numeric) AS avg_rating
  FROM kemenag_survey.responses r
  JOIN kemenag_survey.response_answers ra ON ra.response_id = r.id
  JOIN kemenag_survey.unsur u ON u.id = ra.unsur_id
  WHERE u.is_active = true
  GROUP BY date_trunc('month', r.submitted_at), ra.unsur_id, u.index_type
),
aktif_unsur AS (
  SELECT index_type, COUNT(*) as total
  FROM kemenag_survey.unsur WHERE is_active = true
  GROUP BY index_type
),
tertimbang AS (
  SELECT
    m.bulan,
    m.index_type,
    m.avg_rating / au.total AS weighted
  FROM monthly m
  JOIN aktif_unsur au ON au.index_type = m.index_type
)
SELECT
  bulan,
  index_type,
  ROUND((SUM(weighted) * 25)::numeric, 2) AS nilai_konversi
FROM tertimbang
GROUP BY bulan, index_type
ORDER BY bulan;

-- ============================================================
-- RLS ENABLE
-- ============================================================
ALTER TABLE kemenag_survey.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.survey_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.unsur ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.demographic_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.demographic_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.response_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.response_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_survey.app_settings ENABLE ROW LEVEL SECURITY;
