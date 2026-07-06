export interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SurveyPeriod {
  id: string
  period_type: 'triwulan' | 'semester' | 'tahunan'
  label: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Unsur {
  id: string
  index_type: 'IPKP' | 'IPAK'
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  unsur_id: string
  service_id: string | null
  question_text_id: string
  question_text_en: string
  input_type: 'star_rating'
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  unsur?: Unsur
}

export interface DemographicField {
  id: string
  field_key: string
  label_id: string
  label_en: string
  field_type: 'select' | 'text' | 'number'
  is_required: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  options?: DemographicOption[]
}

export interface DemographicOption {
  id: string
  field_id: string
  value: string
  label_id: string
  label_en: string
  sort_order: number
}

export interface Response {
  id: string
  service_id: string
  period_id: string
  is_anonymous: boolean
  respondent_name: string | null
  respondent_contact: string | null
  locale: string
  turnstile_verified: boolean
  ip_address: string | null
  submitted_at: string
  service?: Service
  period?: SurveyPeriod
}

export interface ResponseAnswer {
  id: string
  response_id: string
  question_id: string
  unsur_id: string
  rating_value: number
}

export interface ResponseDemographic {
  id: string
  response_id: string
  field_id: string
  value: string
}

export interface AppSetting {
  key: string
  value: string
  updated_at: string
}

export interface IndexSummary {
  index_type: 'IPKP' | 'IPAK'
  nilai_index: number
  nilai_konversi: number
  mutu: 'A' | 'B' | 'C' | 'D'
  kinerja: string
  calculated_at: string
}

export interface IndexByService {
  service_id: string
  service_name: string
  index_type: 'IPKP' | 'IPAK'
  nilai_index: number
  nilai_konversi: number
  mutu: 'A' | 'B' | 'C' | 'D'
}

export interface IndexTrend {
  bulan: string
  index_type: 'IPKP' | 'IPAK'
  nilai_konversi: number
}

export interface UnsurWithQuestions extends Unsur {
  questions: Question[]
}
