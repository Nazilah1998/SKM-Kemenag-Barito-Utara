'use server'

import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: process.env.NEXT_PUBLIC_PUSDATIN_SCHEMA || 'kemenag_survey' }
    }
  )
}

export async function setActivePeriodAction(id: string) {
  const supabase = getAdminSupabase()

  // First, deactivate all other periods
  const { error: error1 } = await supabase
    .from('survey_periods')
    .update({ is_active: false })
    .neq('id', id)

  if (error1) {
    console.error('Error deactivating other periods:', error1)
    return { success: false, error: 'Gagal menonaktifkan periode lain' }
  }

  // Then activate the target period
  const { error: error2 } = await supabase
    .from('survey_periods')
    .update({ is_active: true })
    .eq('id', id)

  if (error2) {
    console.error('Error activating period:', error2)
    return { success: false, error: 'Gagal mengaktifkan periode terpilih' }
  }

  return { success: true }
}

export async function deactivatePeriodAction(id: string) {
  const supabase = getAdminSupabase()

  const { error } = await supabase
    .from('survey_periods')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating period:', error)
    return { success: false, error: 'Gagal menonaktifkan periode' }
  }

  return { success: true }
}
