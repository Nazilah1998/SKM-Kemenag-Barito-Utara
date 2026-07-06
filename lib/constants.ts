export const ADMIN_EMAIL = 'baritoutara@kemenag.go.id'

export const SURVEY_ROUTES = {
  HOME: '/',
  SURVEI: '/survei',
  HASIL: '/hasil',
  PROFIL: '/profil',
  BARCODE: '/barcode',
  ADMIN: '/admin',
} as const

export const NILAI_MUTU: Record<string, { grade: string; label_id: string; label_en: string }> = {
  A: { grade: 'A', label_id: 'Sangat Baik', label_en: 'Excellent' },
  B: { grade: 'B', label_id: 'Baik', label_en: 'Good' },
  C: { grade: 'C', label_id: 'Kurang Baik', label_en: 'Poor' },
  D: { grade: 'D', label_id: 'Tidak Baik', label_en: 'Bad' },
}
