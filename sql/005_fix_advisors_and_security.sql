-- ============================================================
-- MIGRATION: 005_fix_advisors_and_security.sql
-- FIX: Supabase Performance & Security Advisor Warnings and Errors
-- ============================================================

-- ------------------------------------------------------------
-- 1. DROP DUPLICATE INDEXES (Performance Advisor)
-- ------------------------------------------------------------
DROP INDEX IF EXISTS kemenag_survey.idx_response_answers_response_id_fkey;
DROP INDEX IF EXISTS kemenag_survey.idx_response_answers_unsur_id_fkey;
DROP INDEX IF EXISTS kemenag_survey.idx_response_demographics_response_id_fkey;
DROP INDEX IF EXISTS kemenag_survey.idx_responses_period_id_fkey;
DROP INDEX IF EXISTS kemenag_survey.idx_responses_service_id_fkey;

-- ------------------------------------------------------------
-- 2. FIX MULTIPLE PERMISSIVE & AUTH RLS INITPLAN (Performance Advisor)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated all service_categories" ON kemenag_survey.service_categories;
DROP POLICY IF EXISTS "Allow authenticated write service_categories" ON kemenag_survey.service_categories;
DROP POLICY IF EXISTS "Allow authenticated insert service_categories" ON kemenag_survey.service_categories;
DROP POLICY IF EXISTS "Allow authenticated update service_categories" ON kemenag_survey.service_categories;
DROP POLICY IF EXISTS "Allow authenticated delete service_categories" ON kemenag_survey.service_categories;

CREATE POLICY "Allow authenticated insert service_categories"
  ON kemenag_survey.service_categories
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update service_categories"
  ON kemenag_survey.service_categories
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated delete service_categories"
  ON kemenag_survey.service_categories
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

-- ------------------------------------------------------------
-- 3. ENABLE RLS ON UNPROTECTED TABLES (Security Advisor - Errors)
-- ------------------------------------------------------------
ALTER TABLE kemenag_website.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_website.galeri ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_website.layanan_publik ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_website.pegawai_seksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_website.seksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_website.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kemenag_website.testimonials ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. FIX FUNCTION SEARCH PATH MUTABLE (Security Advisor - Warnings)
-- ------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE (n.nspname = 'kemenag_survey' AND p.proname = 'get_response_count')
       OR (n.nspname = 'kemenag_arsip' AND p.proname IN ('get_user_bidang_id', 'get_pusdatin_user', 'get_user_role'))
       OR (n.nspname = 'public' AND p.proname IN ('log_pusdatin_audit', 'get_pusdatin_user', 'get_response_count'))
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = %I, public, pg_temp', r.nspname, r.proname, r.args, r.nspname);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5. FIX RLS POLICY ALWAYS TRUE (Security Advisor - Warnings)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert audit_logs for authenticated" ON kemenag_survey.audit_logs;
CREATE POLICY "Allow insert audit_logs for authenticated" 
  ON kemenag_survey.audit_logs FOR INSERT TO authenticated 
  WITH CHECK (action IS NOT NULL);

DROP POLICY IF EXISTS "Allow public insert on responses" ON kemenag_survey.responses;
CREATE POLICY "Allow public insert on responses" 
  ON kemenag_survey.responses FOR INSERT TO public 
  WITH CHECK (service_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow public insert on response_answers" ON kemenag_survey.response_answers;
CREATE POLICY "Allow public insert on response_answers" 
  ON kemenag_survey.response_answers FOR INSERT TO public 
  WITH CHECK (response_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow public insert on response_demographics" ON kemenag_survey.response_demographics;
CREATE POLICY "Allow public insert on response_demographics" 
  ON kemenag_survey.response_demographics FOR INSERT TO public 
  WITH CHECK (response_id IS NOT NULL);

-- ------------------------------------------------------------
-- 6. FIX RLS ENABLED NO POLICY (Security Advisor - Info)
-- ------------------------------------------------------------
DO $$
DECLARE
  tables_to_fix TEXT[] := ARRAY[
    'kemenag_ptsp.ptsp_appointments',
    'kemenag_ptsp.ptsp_auth_otps',
    'kemenag_ptsp.ptsp_data_cuti_pegawai',
    'kemenag_ptsp.ptsp_data_pejabat',
    'kemenag_ptsp.ptsp_feedbacks',
    'kemenag_ptsp.ptsp_generated_documents',
    'kemenag_ptsp.ptsp_guest_book',
    'kemenag_ptsp.ptsp_laporan_kinerja',
    'kemenag_ptsp.ptsp_laporan_kinerja_bulanan',
    'kemenag_ptsp.ptsp_master_options',
    'kemenag_ptsp.ptsp_notifications',
    'kemenag_ptsp.ptsp_pengajuan_cuti',
    'kemenag_ptsp.ptsp_recycled_numbers',
    'kemenag_ptsp.ptsp_rekap_cuti_tahunan',
    'kemenag_ptsp.ptsp_request_number_sequences',
    'kemenag_ptsp.ptsp_service_form_fields',
    'kemenag_ptsp.ptsp_service_items',
    'kemenag_ptsp.ptsp_service_request_answers',
    'kemenag_ptsp.ptsp_service_request_documents',
    'kemenag_ptsp.ptsp_service_request_reviews',
    'kemenag_ptsp.ptsp_service_requests',
    'kemenag_ptsp.ptsp_service_requirements',
    'kemenag_ptsp.ptsp_services',
    'kemenag_ptsp.ptsp_system_status',
    'kemenag_ptsp.ptsp_usul_pensiun',
    'kemenag_ptsp.ptsp_whatsapp_outbox',
    'kemenag_pusdatin.ptsp_activity_logs',
    'kemenag_website.ai_knowledge_base',
    'kemenag_website.categories',
    'kemenag_website.homepage_slides',
    'kemenag_website.news',
    'kemenag_website.report_categories',
    'kemenag_website.report_documents',
    'kemenag_website.static_pages'
  ];
  t TEXT;
  s_name TEXT;
  t_name TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_fix LOOP
    s_name := split_part(t, '.', 1);
    t_name := split_part(t, '.', 2);
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = s_name AND tablename = t_name
    ) THEN
      EXECUTE format('CREATE POLICY "Strict Deny All" ON %I.%I FOR ALL USING (false)', s_name, t_name);
    END IF;
  END LOOP;
END $$;
