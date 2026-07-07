'use server'

import { createClient } from '@supabase/supabase-js'

export async function setActivePeriodAction(id: string) {
  // Use service_role key to bypass RLS for admin actions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: process.env.NEXT_PUBLIC_PUSDATIN_SCHEMA || 'kemenag_survey' }
    }
  )

  // First, deactivate all periods
  const { error: error1 } = await supabase
    .from('survey_periods')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error1) {
    console.error('Error deactivating periods:', error1)
    return { success: false, error: 'Gagal menonaktifkan periode lain' }
  }

  // Then activate the selected one
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
