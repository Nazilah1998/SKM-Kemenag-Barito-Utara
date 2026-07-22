'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Send, Loader2, Info, User, Phone, ListTodo, ShieldAlert, FileText, Building2, Check, ShieldCheck, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'

function getServiceCategory(service: Service): string {
  if (service.description && service.description.trim().length > 0) {
    return service.description.trim()
  }
  const lower = service.name.toLowerCase()
  if (lower.includes('pensiun') || lower.includes('pangkat') || lower.includes('mutasi') || lower.includes('kepegawaian') || lower.includes('cuti') || lower.includes('kgb')) {
    return 'Layanan Kepegawaian & SDM'
  }
  if (lower.includes('haji') || lower.includes('umrah') || lower.includes('paspor')) {
    return 'Layanan Penyelenggaraan Haji & Umrah'
  }
  if (lower.includes('emis') || lower.includes('ijazah') || lower.includes('siswa') || lower.includes('madrasah') || lower.includes('ijin operasional') || lower.includes('tpq') || lower.includes('pesantren')) {
    return 'Layanan Pendidikan Agama & Keagamaan'
  }
  if (lower.includes('gereja') || lower.includes('rohaniwan') || lower.includes('kua') || lower.includes('nikah') || lower.includes('masjid') || lower.includes('rumah ibadah') || lower.includes('zakat') || lower.includes('wakaf')) {
    return 'Layanan Bimbingan & Urusan Keagamaan'
  }
  return 'Layanan Tata Usaha'
}
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/components/shared/I18nProvider'
import { StarRating } from '@/components/shared/StarRating'
import { SurveyThankYou } from '@/components/shared/SurveyThankYou'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { Footer } from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Service, SurveyPeriod, UnsurWithQuestions, DemographicField } from '@/types'

const formSchema = z.object({
  service_id: z.string().min(1, { message: 'survey.select_service_error' }),
  is_anonymous: z.boolean(),
  respondent_name: z.string().min(1, "Nama wajib diisi dengan huruf dan tanda baca umum").regex(/^[a-zA-Z\s.,'-]+$/, "Nama wajib diisi dengan huruf dan tanda baca umum"),
  respondent_contact: z.string().regex(/^[0-9]{10,13}$/, "Kontak wajib 10-13 digit angka"),
  respondent_address: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function SurveiPage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [disclaimerOpen, setDisclaimerOpen] = useState(true)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [period, setPeriod] = useState<SurveyPeriod | null>(null)
  const [ipkpUnsur, setIpkpUnsur] = useState<UnsurWithQuestions[]>([])
  const [ipakUnsur, setIpakUnsur] = useState<UnsurWithQuestions[]>([])
  const [demographicFields, setDemographicFields] = useState<DemographicField[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitReady, setSubmitReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [demographics, setDemographics] = useState<Record<string, string>>({})
  const [ipkpFeedback, setIpkpFeedback] = useState('')
  const [ipakFeedback, setIpakFeedback] = useState('')

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { service_id: '', is_anonymous: false, respondent_name: '', respondent_contact: '', respondent_address: '' },
  })

  const isAnonymous = useWatch({ control, name: 'is_anonymous' })
  const selectedServiceId = useWatch({ control, name: 'service_id' })
  const respondentName = useWatch({ control, name: 'respondent_name' }) || ''
  const respondentContact = useWatch({ control, name: 'respondent_contact' }) || ''

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        const [servicesRes, periodsRes, unsurRes, fieldsRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('survey_periods').select('*').eq('is_active', true).maybeSingle(),
          supabase.from('unsur').select('*, questions(*)').eq('is_active', true).order('sort_order'),
          supabase.from('demographic_fields').select('*, demographic_options(*)').eq('is_active', true).order('sort_order'),
        ])

        if (servicesRes.error) console.error('services error', servicesRes.error)
        if (periodsRes.error) console.error('periods error', periodsRes.error)
        if (unsurRes.error) console.error('unsur error', unsurRes.error)
        if (fieldsRes.error) console.error('fields error', fieldsRes.error)

        if (servicesRes.data) {
          const s = servicesRes.data as Service[]
          setServices(s)
          const params = new URLSearchParams(window.location.search)
          const sid = params.get('service')
          const foundService = sid ? s.find((x) => x.slug === sid) : null
          if (foundService) {
            setValue('service_id', foundService.id)
          }
        }
        let activePeriod = (periodsRes.data as SurveyPeriod | null)

        if (!activePeriod) {
          // If no period is explicitly marked active, fallback to matching today's date range
          const today = new Date().toISOString().split('T')[0]
          const { data: rangePeriod } = await supabase
            .from('survey_periods')
            .select('*')
            .lte('start_date', today)
            .gte('end_date', today)
            .order('start_date', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (rangePeriod) {
            activePeriod = rangePeriod as SurveyPeriod
          } else {
            // Otherwise fallback to the latest period
            const { data: latestPeriod } = await supabase
              .from('survey_periods')
              .select('*')
              .order('start_date', { ascending: false })
              .limit(1)
              .maybeSingle()
            if (latestPeriod) activePeriod = latestPeriod as SurveyPeriod
          }
        }

        if (activePeriod) setPeriod(activePeriod)

        const unsurData = ((unsurRes.data || []) as unknown as UnsurWithQuestions[]).map(u => ({
          ...u,
          questions: u.questions ? [...u.questions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : []
        }))
        setIpkpUnsur(unsurData.filter((u) => u.index_type === 'IPKP'))
        setIpakUnsur(unsurData.filter((u) => u.index_type === 'IPAK'))

        if (fieldsRes.data) {
          const fields = (fieldsRes.data as DemographicField[]).map(field => ({
            ...field,
            demographic_options: field.demographic_options
              ? [...field.demographic_options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              : []
          }))
          setDemographicFields(fields)
        }
      } catch (err) {
        console.error('fetchData error:', err)
        toast.error('Gagal mengambil data survei')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setValue])

  const allQuestions = [...ipkpUnsur.flatMap((u) => u.questions), ...ipakUnsur.flatMap((u) => u.questions)]
  const totalSteps = 5

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (step === totalSteps - 1) {
      const timer = setTimeout(() => setSubmitReady(true), 500)
      return () => clearTimeout(timer)
    }
  }, [step, totalSteps])

  const canProceed = useCallback(() => {
    if (step === 0) {
      if (!selectedServiceId) return false
      if (isAnonymous) return true
      if (!respondentName || !respondentContact) return false
      if (!/^[a-zA-Z\s.,'-]+$/.test(respondentName)) return false
      if (!/^[0-9]{10,13}$/.test(respondentContact)) return false
      return true
    }
    if (step === 1) {
      const requiredFields = demographicFields.filter(f => f.is_required)
      const isRequiredValid = requiredFields.every(f => !!demographics[f.id])
      if (!isRequiredValid) return false

      // Check toggle fields (disabilitas)
      for (const field of demographicFields) {
        if (field.field_type === 'toggle') {
          const val = demographics[field.id] || ''
          if (val.startsWith('Ya')) {
            if (field.demographic_options && field.demographic_options.length > 0) {
              if (!val.includes('(') || !val.includes(')')) {
                return false
              }
            }
          }
        }
      }

      return true
    }
    if (step === 2) {
      const ipkpQuestions = ipkpUnsur.flatMap((u) => u.questions)
      return ipkpQuestions.every((q) => answers[q.id] && answers[q.id] > 0)
    }
    if (step === 3) {
      const ipakQuestions = ipakUnsur.flatMap((u) => u.questions)
      return ipakQuestions.every((q) => answers[q.id] && answers[q.id] > 0)
    }
    if (step === 4) return true
    return true
  }, [step, selectedServiceId, isAnonymous, respondentName, respondentContact, answers, demographics, demographicFields, ipkpUnsur, ipakUnsur])

  function canStepProceed(s: number): boolean {
    if (s === 0) {
      if (!selectedServiceId) return false
      if (isAnonymous) return true
      if (!respondentName || !respondentContact) return false
      if (!/^[a-zA-Z\s.,'-]+$/.test(respondentName)) return false
      if (!/^[0-9]{10,13}$/.test(respondentContact)) return false
      return true
    }
    if (s === 1) {
      const required = demographicFields.filter(f => f.is_required)
      const isRequiredValid = required.every(f => !!demographics[f.id])
      if (!isRequiredValid) return false

      for (const field of demographicFields) {
        if (field.field_type === 'toggle') {
          const val = demographics[field.id] || ''
          if (val.startsWith('Ya')) {
            if (field.demographic_options && field.demographic_options.length > 0) {
              if (!val.includes('(') || !val.includes(')')) {
                return false
              }
            }
          }
        }
      }

      return true
    }
    if (s === 2) {
      const qs = ipkpUnsur.flatMap(u => u.questions)
      return qs.every(q => answers[q.id] && answers[q.id] > 0)
    }
    if (s === 3) {
      const qs = ipakUnsur.flatMap(u => u.questions)
      return qs.every(q => answers[q.id] && answers[q.id] > 0)
    }
    if (s === 4) return true
    return true
  }

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1)
    setSubmitReady(false)
    setStep(next)
  }

  const getCurrentPeriodText = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const isEn = locale === 'en'
    
    let triwulan = ''
    if (month >= 1 && month <= 3) triwulan = isEn ? 'Quarter 1' : 'Triwulan I'
    else if (month >= 4 && month <= 6) triwulan = isEn ? 'Quarter 2' : 'Triwulan II'
    else if (month >= 7 && month <= 9) triwulan = isEn ? 'Quarter 3' : 'Triwulan III'
    else triwulan = isEn ? 'Quarter 4' : 'Triwulan IV'
    
    return isEn ? `${triwulan} Year ${year}` : `${triwulan} Tahun ${year}`
  }

  async function onSubmit(formData: FormValues) {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      const supabase = createClient()

      const responseId = crypto.randomUUID()

      const { error: responseError } = await supabase
        .from('responses')
        .insert({
          id: responseId,
          service_id: formData.service_id,
          period_id: period?.id || null,
          is_anonymous: formData.is_anonymous,
          respondent_name: formData.respondent_name?.trim() || 'Anonim',
          respondent_contact: formData.respondent_contact?.trim() || '-',
          respondent_address: formData.respondent_address?.trim() || null,
          ipkp_feedback: ipkpFeedback.trim() || null,
          ipak_feedback: ipakFeedback.trim() || null,
          locale,
          turnstile_verified: true,
        })

      if (responseError) {
        console.error('[onSubmit] response insert error:', responseError)
        toast.error(t('survey.error_submit'))
        setSubmitting(false)
        return
      }

      const validFieldIds = new Set(demographicFields.map((f) => f.id))

      const demoEntries = Object.entries(demographics)
        .filter(([field_id, value]) => validFieldIds.has(field_id) && value !== undefined && value !== null && String(value).trim() !== '')
        .map(([field_id, value]) => ({
          response_id: responseId,
          field_id,
          value: String(value).trim(),
        }))

      if (demoEntries.length > 0) {
        const { error: demoError } = await supabase.from('response_demographics').insert(demoEntries)
        if (demoError) {
          console.error('[onSubmit] demo insert error:', demoError)
          toast.error('Gagal mengirim data demografi. Silakan coba lagi.')
          setSubmitting(false)
          return
        }
      }

      const answerEntries = Object.entries(answers)
        .filter(([qId, val]) => qId && val !== undefined && val !== null && val > 0)
        .map(([questionId, ratingValue]) => {
          const question = allQuestions.find((q) => q.id === questionId)
          return {
            response_id: responseId,
            question_id: questionId,
            unsur_id: question?.unsur_id || '',
            rating_value: ratingValue,
          }
        })
        .filter((entry) => entry.unsur_id !== '')

      if (answerEntries.length > 0) {
        const { error: answersError } = await supabase.from('response_answers').insert(answerEntries)
        if (answersError) {
          console.error('[onSubmit] answers insert error:', answersError)
          toast.error('Gagal mengirim jawaban survei. Silakan coba lagi.')
          setSubmitting(false)
          return
        }
      }

      setSubmitted(true)
    } catch {
      toast.error(t('survey.error_submit'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleAnswerChange(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleDemographicChange(fieldId: string, value: string) {
    setDemographics((prev) => ({ ...prev, [fieldId]: value }))
  }

  if (submitted) return <SurveyThankYou />

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-muted-foreground">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <>
      {/* Floating Disclaimer / PERHATIAN Modal Dialog */}
      <AnimatePresence>
        {disclaimerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-slate-200/90 dark:border-gray-800 shadow-2xl"
            >
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 p-6 text-white text-center relative">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-3 shadow-inner">
                  <ShieldAlert className="size-8 text-amber-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                  {locale === 'en' ? 'ATTENTION!' : 'PERHATIAN!'}
                </h2>
                <p className="text-xs text-emerald-200/90 mt-1 font-medium">
                  {locale === 'en'
                    ? 'Public Satisfaction Survey Respondent Consent Statement'
                    : 'Pernyataan Persetujuan Responden Survei Kepuasan Masyarakat'}
                </p>
              </div>

              {/* Content Body */}
              <div className="p-6 sm:p-8 space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
                <p className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                  {locale === 'en' ? 'I hereby declare that:' : 'Dengan ini saya menyatakan bahwa:'}
                </p>

                <div className="space-y-3.5 bg-slate-50 dark:bg-gray-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-gray-700 font-medium">
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black mt-0.5">1</span>
                    <p>
                      {locale === 'en' ? (
                        <>I am willing to complete this questionnaire and consent to my data being used for the <strong>Public Satisfaction Survey</strong> at the Ministry of Religious Affairs of Barito Utara Regency.</>
                      ) : (
                        <>Saya bersedia mengisi kuesioner ini dan mengizinkan data pribadi saya digunakan untuk kebutuhan <strong>Survei Kepuasan Masyarakat</strong> pada Kantor Kementerian Agama Kabupaten Barito Utara.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black mt-0.5">2</span>
                    <p>
                      {locale === 'en' ? (
                        <>All data and answers I enter correspond to the <strong>actual facts and true conditions</strong> known to me.</>
                      ) : (
                        <>Semua data dan jawaban yang saya entrikan sudah sesuai dengan <strong>fakta dan kondisi sebenarnya</strong> yang saya ketahui.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black mt-0.5">3</span>
                    <p>
                      {locale === 'en' ? (
                        <>I also assume <strong>full responsibility</strong> for all information filled in this survey form and agree to abide by the provisions regulated under <strong>Law No. 11 of 2008 concerning Electronic Information & Transactions (ITE)</strong>.</>
                      ) : (
                        <>Saya juga <strong>bertanggung jawab penuh</strong> terhadap data dan informasi yang saya isikan pada formulir survei ini dan bersedia mengikuti ketentuan sebagaimana yang diatur dalam <strong>UU Nomor 11 Tahun 2008 tentang ITE</strong>.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 sm:p-6 bg-slate-50/80 dark:bg-gray-800/40 border-t border-slate-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full sm:w-auto rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-extrabold text-xs sm:text-sm py-5 px-6 gap-2 cursor-pointer"
                >
                  <X className="size-4" />
                  <span>{locale === 'en' ? 'Disagree' : 'Tidak Setuju'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setDisclaimerOpen(false)}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl py-5 px-8 shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="size-4 text-emerald-200" />
                  <span>{locale === 'en' ? 'Agree & Continue' : 'Setuju & Lanjutkan'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PublicNavbar />
      <main className="flex-1 bg-slate-50/70 dark:bg-gray-950 pb-6">
        <div className="w-full px-1.5 sm:px-8 lg:px-16 xl:px-20 py-4 sm:py-8">
          
          {/* Header Banner Card */}
          <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-3xl p-4 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/20">
            <div className="flex flex-row items-center gap-3 sm:gap-4 border-b border-slate-100 dark:border-gray-800 pb-4 mb-4 sm:pb-6 sm:mb-6">
              <div className="flex size-10 sm:size-14 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
                <ListTodo className="size-5 sm:size-7" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {locale === 'en' ? 'IPKP & IPAK Index Survey Questionnaire' : 'Kuesioner Survei Indeks IPKP & IPAK'}
                </h1>
                <p className="text-[11px] sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
                  {getCurrentPeriodText()} • {locale === 'en' ? 'Ministry of Religious Affairs of Barito Utara Regency' : 'Kantor Kementerian Agama Kabupaten Barito Utara'}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 text-emerald-950 dark:text-emerald-200 flex items-start gap-3.5">
              <Info className="size-5 sm:size-6 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {locale === 'en' ? (
                  <>Please complete all fields in the form below by providing an objective assessment of the services you received at <strong>THE MINISTRY OF RELIGIOUS AFFAIRS OF BARITO UTARA REGENCY</strong>.</>
                ) : (
                  <>Silakan lengkapi seluruh isian formulir di bawah ini dengan memberikan penilaian objektif mengenai pelayanan yang Anda terima pada <strong>KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA</strong>.</>
                )}
              </p>
            </div>
          </div>
          
          {/* Step Progress Tracker */}
          <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 p-3 sm:p-6 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {Array.from({ length: totalSteps }, (_, i) => {
                const isCompleted = canStepProceed(i)
                const isReachable = i <= step || Array.from({ length: i }, (_, j) => j).every(j => canStepProceed(j))
                const stepNames = locale === 'en'
                  ? ['Identity', 'Demographics', 'IPKP', 'IPAK', 'Submit']
                  : ['Identitas', 'Demografi', 'IPKP', 'IPAK', 'Kirim']

                return (
                  <div key={i} className="flex items-center gap-1 sm:gap-3 flex-1 justify-center min-w-0">
                    <button
                      type="button"
                      onClick={() => isReachable && goToStep(i)}
                      className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                        !isReachable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      disabled={!isReachable}
                      title={!isReachable ? 'Selesaikan langkah sebelumnya terlebih dahulu' : ''}
                    >
                      <div className={`flex size-7.5 sm:size-10 items-center justify-center rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black transition-all duration-200 ${
                        i === step
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 sm:ring-4 ring-emerald-100 dark:ring-emerald-950 scale-105'
                          : i < step && isCompleted
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : isReachable
                          ? 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          : 'bg-slate-100 dark:bg-gray-800 text-slate-400'
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`text-[9px] sm:text-xs font-bold tracking-tight text-center truncate max-w-[55px] sm:max-w-none ${
                        i === step ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
                      }`}>
                        {stepNames[i]}
                      </span>
                    </button>

                    {i < totalSteps - 1 && (
                      <div className={`h-1 flex-1 rounded-full transition-colors hidden sm:block ${
                        i < step ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-gray-800'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 0 && (
              <Card className="border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-6">
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="size-5 text-emerald-600" />
                    <span>{locale === 'en' ? 'Select Service Type & Respondent Identity' : 'Pilihan Jenis Layanan & Identitas Responden'}</span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {locale === 'en' ? 'Select Service Type Received' : 'Pilih Jenis Layanan yang Diterima'} <span className="text-rose-500">*</span>
                    </Label>
                    <Controller
                      name="service_id"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => v !== null && field.onChange(v)}>
                          <SelectTrigger className="w-full rounded-2xl border-slate-200 dark:border-gray-800 py-6 text-xs sm:text-sm font-semibold shadow-xs">
                            <SelectValue placeholder={t('survey.select_service_placeholder')}>
                              {field.value ? (
                                <span className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 font-bold">
                                  <FileText className="size-4 text-emerald-600 shrink-0" />
                                  <span className="truncate">{services.find((s) => s.id === field.value)?.name}</span>
                                </span>
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[420px] rounded-2xl p-2 shadow-2xl border-slate-200">
                            {(() => {
                              const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
                                const cat = getServiceCategory(s)
                                if (!acc[cat]) acc[cat] = []
                                acc[cat].push(s)
                                return acc
                              }, {})

                              return Object.entries(grouped).map(([category, items]) => (
                                <SelectGroup key={category} className="mb-2.5 last:mb-0">
                                  <SelectLabel className="px-3 py-1.5 text-[11px] font-black tracking-wider uppercase text-emerald-800 bg-emerald-100/70 dark:bg-emerald-950/70 rounded-xl mb-1 flex items-center gap-1.5">
                                    <Building2 className="size-3.5 text-emerald-600" />
                                    <span>{category}</span>
                                  </SelectLabel>
                                  {items.map((s, idx) => (
                                    <SelectItem key={s.id} value={s.id} className="rounded-xl py-2 cursor-pointer my-0.5">
                                      <div className="flex items-center gap-2.5 w-full pl-1">
                                        <span className="flex size-5 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black shrink-0 border border-emerald-200/80">
                                          {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm">{s.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))
                            })()}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.service_id && (
                      <p className="text-xs font-semibold text-rose-500">{t(errors.service_id.message as string)}</p>
                    )}
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <User className="size-4 text-emerald-600" />
                          <span>{t('survey.name')}</span> <span className="text-rose-500">*</span>
                        </Label>
                        <Controller
                          name="respondent_name"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              placeholder={locale === 'en' ? 'Enter your full name...' : 'Masukkan nama lengkap Anda...'}
                              {...field} 
                              className="rounded-2xl border-slate-200 text-xs sm:text-sm font-semibold py-5"
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '')
                                const titleCase = val.replace(/\b\w/g, c => c.toUpperCase())
                                field.onChange(titleCase)
                              }}
                            />
                          )}
                        />
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic pl-1 -mt-0.5">
                          {locale === 'en' ? '* May include academic / religious titles' : '* Bisa dicantumkan beserta gelar (akademis / keagamaan)'}
                        </p>
                        {errors.respondent_name && (
                          <p className="text-xs font-semibold text-rose-500 pl-1">{errors.respondent_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Phone className="size-4 text-emerald-600" />
                          <span>{locale === 'en' ? 'Contact (Phone/WhatsApp)' : 'Kontak (HP/WhatsApp)'}</span> <span className="text-rose-500">*</span>
                        </Label>
                        <Controller
                          name="respondent_contact"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              type="tel"
                              maxLength={13}
                              placeholder="08123456789"
                              {...field}
                              className="rounded-2xl border-slate-200 text-xs sm:text-sm font-mono py-5"
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                            />
                          )}
                        />
                        <p className="text-[11px] font-medium text-rose-500 italic pl-1 -mt-0.5">
                          {locale === 'en' ? '* Must be an active phone number' : '* Harus nomor telepon yang aktif'}
                        </p>
                        {errors.respondent_contact && (
                          <p className="text-xs font-semibold text-rose-500 pl-1">{errors.respondent_contact.message}</p>
                        )}
                      </div>
                    </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200/80 dark:border-gray-700">
                    <div className="space-y-0.5">
                      <Label className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="size-4 text-amber-500" />
                        <span>{t('survey.anonymous')}</span>
                      </Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('survey.anonymous_desc')}</p>
                    </div>
                    <Controller
                      name="is_anonymous"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card className="border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-6">
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="size-5 text-emerald-600" />
                    <span>{t('survey.demographic_info')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {demographicFields.map((field) => {
                    const labelText = locale === 'id' ? field.label_id : field.label_en

                    return (
                      <div key={field.id} className="space-y-2.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                            <FileText className="size-3.5" />
                          </span>
                          <span>{labelText}</span>
                          {field.is_required && <span className="text-rose-500">*</span>}
                        </Label>

                        {field.field_type === 'select' ? (
                          <Select
                            value={demographics[field.id] || ''}
                            onValueChange={(v) => v !== null && handleDemographicChange(field.id, v)}
                          >
                            <SelectTrigger className="w-full rounded-2xl border-slate-200 dark:border-gray-800 py-6 text-xs sm:text-sm font-semibold shadow-xs">
                              <SelectValue placeholder={`-- ${locale === 'id' ? 'Pilih' : 'Select'} ${labelText} --`} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl p-1.5 shadow-xl">
                              {field.demographic_options?.map((opt) => (
                                <SelectItem key={opt.id} value={opt.value} className="rounded-xl py-2 cursor-pointer text-xs sm:text-sm font-semibold">
                                  {locale === 'id' ? opt.label_id : opt.label_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.field_type === 'checkbox' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200/80 dark:border-gray-700">
                            {field.demographic_options?.map((opt) => {
                              const currentVals = (demographics[field.id] || '').split(',').filter(Boolean)
                              const isChecked = currentVals.includes(opt.value)
                              return (
                                <label key={opt.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-700 cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let newVals: string[]
                                      if (e.target.checked) {
                                        newVals = [...currentVals, opt.value]
                                      } else {
                                        newVals = currentVals.filter(v => v !== opt.value)
                                      }
                                      handleDemographicChange(field.id, newVals.join(','))
                                    }}
                                    className="size-4 text-emerald-600 rounded focus:ring-emerald-500"
                                  />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{locale === 'id' ? opt.label_id : opt.label_en}</span>
                                </label>
                              )
                            })}
                          </div>
                        ) : field.field_type === 'toggle' ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200/80 dark:border-gray-700">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Status Opsi ({demographics[field.id]?.startsWith('Ya') ? 'Ya' : 'Tidak'})
                              </span>
                              <Switch
                                checked={demographics[field.id]?.startsWith('Ya') || false}
                                onCheckedChange={(val) => {
                                  if (val) {
                                    handleDemographicChange(field.id, 'Ya')
                                  } else {
                                    handleDemographicChange(field.id, 'Tidak')
                                  }
                                }}
                              />
                            </div>

                            {/* Sub-options Checkbox List (Tampil saat Toggle = Ya) */}
                            {demographics[field.id]?.startsWith('Ya') && field.demographic_options && field.demographic_options.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3"
                              >
                                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                  {locale === 'id' 
                                    ? 'Jika ya, silakan pilih opsi/kategori yang sesuai (bisa lebih dari satu):' 
                                    : 'If yes, please select applicable options (multiple allowed):'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {field.demographic_options.map((opt) => {
                                    const currentValStr = demographics[field.id] || 'Ya'
                                    const rawOptsStr = currentValStr.includes('(') ? currentValStr.slice(currentValStr.indexOf('(') + 1, currentValStr.lastIndexOf(')')) : ''
                                    const currentVals = rawOptsStr ? rawOptsStr.split(', ').filter(Boolean) : []
                                    const isChecked = currentVals.includes(opt.value)
                                    return (
                                      <label key={opt.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200/80 dark:border-emerald-900 cursor-pointer hover:bg-emerald-100/50 transition-colors shadow-2xs">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            let newVals: string[]
                                            if (e.target.checked) {
                                              newVals = [...currentVals, opt.value]
                                            } else {
                                              newVals = currentVals.filter(v => v !== opt.value)
                                            }
                                            const updatedStr = newVals.length > 0 ? `Ya (${newVals.join(', ')})` : 'Ya'
                                            handleDemographicChange(field.id, updatedStr)
                                          }}
                                          className="size-4 text-emerald-600 rounded focus:ring-emerald-500"
                                        />
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{locale === 'id' ? opt.label_id : opt.label_en}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                                {(!demographics[field.id]?.includes('(') || !demographics[field.id]?.includes(')')) && (
                                  <p className="text-[11px] font-bold text-rose-600 italic flex items-center gap-1 pt-1">
                                    * Wajib memilih minimal 1 kategori disabilitas di atas untuk dapat melanjutkan.
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </div>
                        ) : (
                          <Input
                            type={field.field_type === 'number' ? 'number' : 'text'}
                            placeholder={`Masukkan ${labelText}...`}
                            value={demographics[field.id] || ''}
                            onChange={(e) => handleDemographicChange(field.id, e.target.value)}
                            className="rounded-2xl border-slate-200 text-xs sm:text-sm font-semibold py-5"
                          />
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300">
                      <ListTodo className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-black text-white">{t('survey.ipkp_section')}</CardTitle>
                      <p className="text-xs sm:text-sm text-emerald-200/90 font-medium mt-1">
                        {locale === 'en'
                          ? 'Please rate the quality of public services based on your experience.'
                          : 'Silakan berikan penilaian kualitas pelayanan publik berdasarkan pengalaman Anda.'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 sm:p-8 space-y-6 sm:space-y-8">
                  {ipkpUnsur.map((unsur, uIdx) => (
                    <div key={unsur.id} className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-gray-800">
                        <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                          {uIdx + 1}
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white">
                          {locale === 'en' ? (unsur.name_en || unsur.name) : unsur.name}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {unsur.questions.map((q) => (
                          <div key={q.id} className="flex flex-col gap-3 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-gray-800 p-3.5 sm:p-6 bg-slate-50/70 dark:bg-gray-800/40 shadow-xs hover:border-emerald-200 transition-colors">
                            <p className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-slate-50 leading-relaxed">
                              {locale === 'id' ? q.question_text_id : q.question_text_en}
                            </p>
                            <StarRating
                              value={answers[q.id] || 0}
                              onChange={(v) => handleAnswerChange(q.id, v)}
                              customLabels={q.rating_labels ? {
                                1: q.rating_labels['1'] || (locale === 'en' ? 'Dissatisfied' : 'Tidak Puas'),
                                2: q.rating_labels['2'] || (locale === 'en' ? 'Less Satisfied' : 'Kurang Puas'),
                                3: q.rating_labels['3'] || (locale === 'en' ? 'Satisfied' : 'Puas'),
                                4: q.rating_labels['4'] || (locale === 'en' ? 'Very Satisfied' : 'Sangat Puas'),
                              } : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-6 border-t border-slate-200 dark:border-gray-800 space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="size-4 text-emerald-600" />
                      <span>{locale === 'en' ? 'Service Quality Feedback & Suggestions (Optional)' : 'Saran & Kritik Mengenai Kualitas Pelayanan (Opsional)'}</span>
                    </Label>
                    <Textarea
                      value={ipkpFeedback}
                      onChange={(e) => setIpkpFeedback(e.target.value)}
                      placeholder={locale === 'en' ? 'Write your feedback or suggestions regarding service improvement...' : 'Tuliskan saran atau masukan Anda terkait perbaikan pelayanan...'}
                      rows={3}
                      className="rounded-2xl border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-teal-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300">
                      <ShieldAlert className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-black text-white">{t('survey.ipak_section')}</CardTitle>
                      <p className="text-xs sm:text-sm text-emerald-200/90 font-medium mt-1">
                        {locale === 'en'
                          ? 'Please rate your perception of integrity and corruption prevention.'
                          : 'Silakan berikan penilaian persepsi integritas dan pencegahan korupsi.'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 sm:p-8 space-y-6 sm:space-y-8">
                  {ipakUnsur.map((unsur, uIdx) => (
                    <div key={unsur.id} className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-gray-800">
                        <span className="flex size-7 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-black">
                          {uIdx + 1}
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white">
                          {locale === 'en' ? (unsur.name_en || unsur.name) : unsur.name}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {ipakUnsur.flatMap(u => u.questions).filter(q => q.unsur_id === unsur.id).map((q) => (
                          <div key={q.id} className="flex flex-col gap-3 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-gray-800 p-3.5 sm:p-6 bg-slate-50/70 dark:bg-gray-800/40 shadow-xs hover:border-emerald-200 transition-colors">
                            <p className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-slate-50 leading-relaxed">
                              {locale === 'id' ? q.question_text_id : q.question_text_en}
                            </p>
                            <StarRating
                              value={answers[q.id] || 0}
                              onChange={(v) => handleAnswerChange(q.id, v)}
                              customLabels={q.rating_labels ? {
                                1: q.rating_labels['1'] || (locale === 'en' ? 'Dissatisfied' : 'Tidak Puas'),
                                2: q.rating_labels['2'] || (locale === 'en' ? 'Less Satisfied' : 'Kurang Puas'),
                                3: q.rating_labels['3'] || (locale === 'en' ? 'Satisfied' : 'Puas'),
                                4: q.rating_labels['4'] || (locale === 'en' ? 'Very Satisfied' : 'Sangat Puas'),
                              } : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-6 border-t border-slate-200 dark:border-gray-800 space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="size-4 text-emerald-600" />
                      <span>{locale === 'en' ? 'Corruption Prevention Feedback & Suggestions (Optional)' : 'Saran & Masukan Pencegahan Korupsi (Opsional)'}</span>
                    </Label>
                    <Textarea
                      value={ipakFeedback}
                      onChange={(e) => setIpakFeedback(e.target.value)}
                      placeholder={locale === 'en' ? 'Write your feedback or suggestions regarding corruption prevention...' : 'Tuliskan saran atau masukan Anda terkait pencegahan korupsi...'}
                      rows={3}
                      className="rounded-2xl border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <div className="space-y-6">
                {/* Ringkasan Data Responden */}
                <Card className="border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-6">
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="size-5 text-emerald-600" />
                      <span>{locale === 'en' ? 'Respondent Identity & Selected Service' : 'Data Responden & Layanan'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <dl className="divide-y divide-slate-100 dark:divide-gray-800 text-xs sm:text-sm font-semibold">
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Building2 className="size-4 text-emerald-600" />
                          <span>{locale === 'en' ? 'Target Service Type' : 'Jenis Layanan Target'}</span>
                        </dt>
                        <dd className="font-bold text-slate-900 dark:text-white text-right max-w-[60%]">
                          {services.find(s => s.id === selectedServiceId)?.name || '-'}
                        </dd>
                      </div>
                      {isAnonymous ? (
                        <div className="flex justify-between items-center py-3">
                          <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <ShieldCheck className="size-4 text-amber-600" />
                            <span>{locale === 'en' ? 'Respondent Identity' : 'Identitas Responden'}</span>
                          </dt>
                          <dd className="font-bold inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <ShieldAlert className="size-3.5" /> {locale === 'en' ? 'Anonymous Entry' : 'Isian Anonim'}
                          </dd>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center py-3">
                            <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <User className="size-4 text-emerald-600" />
                              <span>{locale === 'en' ? 'Respondent Name' : 'Nama Responden'}</span>
                            </dt>
                            <dd className="font-bold text-slate-900 dark:text-white">{respondentName || '-'}</dd>
                          </div>
                          <div className="flex justify-between items-center py-3">
                            <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <Phone className="size-4 text-emerald-600" />
                              <span>{locale === 'en' ? 'Contact (Phone/WhatsApp)' : 'Kontak (HP/WhatsApp)'}</span>
                            </dt>
                            <dd className="font-bold text-slate-900 dark:text-white">{respondentContact || '-'}</dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Ringkasan Kelengkapan Jawaban */}
                <Card className="border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-6">
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ListTodo className="size-5 text-emerald-600" />
                      <span>{locale === 'en' ? 'Questionnaire Evaluation Completeness' : 'Kelengkapan Evaluasi Kuesioner'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <dl className="divide-y divide-slate-100 dark:divide-gray-800 text-xs sm:text-sm font-semibold">
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-slate-500 dark:text-slate-400">{locale === 'en' ? 'IPKP Index (Service Quality)' : 'Indeks IPKP (Kualitas Pelayanan)'}</dt>
                        <dd>
                          {(() => {
                            const qs = ipkpUnsur.flatMap(u => u.questions)
                            const filled = qs.filter(q => answers[q.id] && answers[q.id] > 0).length
                            const total = qs.length
                            const isFull = filled === total
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                                isFull ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {isFull && <Check className="size-3.5" />}
                                {filled}/{total} {locale === 'en' ? 'Questions Completed' : 'Pertanyaan Terisi'}
                              </span>
                            )
                          })()}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <dt className="text-slate-500 dark:text-slate-400">{locale === 'en' ? 'IPAK Index (Corruption Prevention)' : 'Indeks IPAK (Pencegahan Korupsi)'}</dt>
                        <dd>
                          {(() => {
                            const qs = ipakUnsur.flatMap(u => u.questions)
                            const filled = qs.filter(q => answers[q.id] && answers[q.id] > 0).length
                            const total = qs.length
                            const isFull = filled === total
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                                isFull ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {isFull && <Check className="size-3.5" />}
                                {filled}/{total} {locale === 'en' ? 'Questions Completed' : 'Pertanyaan Terisi'}
                              </span>
                            )
                          })()}
                        </dd>
                      </div>
                      {ipkpFeedback && (
                        <div className="flex justify-between items-center py-3">
                          <dt className="text-slate-500 dark:text-slate-400">{locale === 'en' ? 'Service Quality Feedback' : 'Saran Kualitas Pelayanan'}</dt>
                          <dd className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="size-4" /> {locale === 'en' ? 'Feedback Filled' : 'Masukan Diisi'}
                          </dd>
                        </div>
                      )}
                      {ipakFeedback && (
                        <div className="flex justify-between items-center py-3">
                          <dt className="text-slate-500 dark:text-slate-400">{locale === 'en' ? 'Corruption Prevention Feedback' : 'Saran Pencegahan Korupsi'}</dt>
                          <dd className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="size-4" /> {locale === 'en' ? 'Feedback Filled' : 'Masukan Diisi'}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Peringatan Konfirmasi */}
                <div className="rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 p-5 flex items-start gap-3.5 shadow-sm">
                  <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
                    {locale === 'en' ? (
                      <>By clicking the <strong>&ldquo;Submit Survey&rdquo;</strong> button, you declare that all answers provided are true and honest. Data will be used for public service quality enhancement at the Ministry of Religious Affairs of Barito Utara Regency.</>
                    ) : (
                      <>Dengan mengklik tombol <strong>&ldquo;Kirim Survei&rdquo;</strong>, Anda menyatakan bahwa seluruh jawaban yang diberikan adalah benar dan jujur. Data akan digunakan untuk peningkatan kualitas pelayanan publik pada Kantor Kementerian Agama Kabupaten Barito Utara.</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(step - 1)}
            disabled={step === 0}
            className="rounded-2xl px-6 py-6 border-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 group cursor-pointer"
          >
            <ChevronLeft className="mr-2 size-4 text-slate-500 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>{t('common.back')}</span>
          </Button>

          {step < totalSteps - 1 ? (
            <Button 
              type="button" 
              onClick={() => goToStep(step + 1)}
              disabled={!canProceed()}
              className="rounded-2xl px-8 py-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-95 group cursor-pointer"
            >
              <span>{locale === 'en' ? 'Next' : 'Lanjut'}</span>
              <ChevronRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!canProceed() || submitting || !submitReady}
              className="rounded-2xl px-9 py-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-xl shadow-emerald-600/25 transition-all duration-200 active:scale-95 group cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              )}
              <span>{locale === 'en' ? 'Submit Survey' : 'Kirim Survei'}</span>
            </Button>
          )}
        </div>
      </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
