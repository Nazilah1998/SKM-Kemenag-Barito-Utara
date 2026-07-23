-- ============================================================
-- SIKAP - Migration 004: Database Optimization & Audit Logs
-- ============================================================

-- 1. Create B-Tree Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at 
  ON kemenag_survey.responses(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_responses_period_id 
  ON kemenag_survey.responses(period_id);

CREATE INDEX IF NOT EXISTS idx_responses_service_id 
  ON kemenag_survey.responses(service_id);

CREATE INDEX IF NOT EXISTS idx_response_answers_response_id 
  ON kemenag_survey.response_answers(response_id);

CREATE INDEX IF NOT EXISTS idx_response_answers_unsur_id 
  ON kemenag_survey.response_answers(unsur_id);

CREATE INDEX IF NOT EXISTS idx_response_demographics_response_id 
  ON kemenag_survey.response_demographics(response_id);

CREATE INDEX IF NOT EXISTS idx_response_demographics_field_val 
  ON kemenag_survey.response_demographics(field_id, value);

-- 2. Create Audit Logs Table for Admin Activity Tracking
CREATE TABLE IF NOT EXISTS kemenag_survey.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  action text NOT NULL,
  entity_name text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON kemenag_survey.audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE kemenag_survey.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select audit_logs for service role" ON kemenag_survey.audit_logs
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Allow insert audit_logs for authenticated" ON kemenag_survey.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
