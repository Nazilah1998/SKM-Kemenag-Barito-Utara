'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Send, Loader2, Info, User, Phone, ListTodo, ShieldAlert, MapPin, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  respondent_name: z.string().optional(),
  respondent_contact: z.string().optional(),
  respondent_address: z.string().optional(),
}).refine(data => data.is_anonymous || (data.respondent_name && /^[a-zA-Z\s.,'-]+$/.test(data.respondent_name)), {
  message: "Nama wajib diisi dengan huruf dan tanda baca umum", path: ["respondent_name"]
}).refine(data => data.is_anonymous || (data.respondent_contact && /^[0-9]{10,13}$/.test(data.respondent_contact)), {
  message: "Kontak wajib 10-13 digit angka", path: ["respondent_contact"]
})

type FormValues = z.infer<typeof formSchema>

export default function SurveiPage() {
  const { t, locale } = useI18n()
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
  const respondentAddress = useWatch({ control, name: 'respondent_address' }) || ''

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
        if (periodsRes.data) setPeriod(periodsRes.data as SurveyPeriod)

        const unsurData = (unsurRes.data || []) as unknown as UnsurWithQuestions[]
        setIpkpUnsur(unsurData.filter((u) => u.index_type === 'IPKP'))
        setIpakUnsur(unsurData.filter((u) => u.index_type === 'IPAK'))

        if (fieldsRes.data) setDemographicFields(fieldsRes.data as DemographicField[])
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
      if (!respondentName || !respondentContact || !respondentAddress) return false
      if (!/^[a-zA-Z\s.,'-]+$/.test(respondentName)) return false
      if (!/^[0-9]{10,13}$/.test(respondentContact)) return false
      if (respondentAddress.trim().length < 5) return false
      return true
    }
    if (step === 1) {
      const requiredFields = demographicFields.filter(f => f.is_required)
      return requiredFields.every(f => !!demographics[f.id])
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
  }, [step, selectedServiceId, respondentName, respondentContact, respondentAddress, answers, demographics, demographicFields, ipkpUnsur, ipakUnsur])

  function canStepProceed(s: number): boolean {
    if (s === 0) {
      if (!selectedServiceId) return false
      if (!respondentName || !respondentContact || !respondentAddress) return false
      if (!/^[a-zA-Z\s.,'-]+$/.test(respondentName)) return false
      if (!/^[0-9]{10,13}$/.test(respondentContact)) return false
      if (respondentAddress.trim().length < 5) return false
      return true
    }
    if (s === 1) {
      const required = demographicFields.filter(f => f.is_required)
      return required.every(f => !!demographics[f.id])
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
    
    let triwulan = ''
    if (month >= 1 && month <= 3) triwulan = 'Triwulan I'
    else if (month >= 4 && month <= 6) triwulan = 'Triwulan II'
    else if (month >= 7 && month <= 9) triwulan = 'Triwulan III'
    else triwulan = 'Triwulan IV'
    
    return `${triwulan} Tahun ${year}`
  }

  async function onSubmit(formData: FormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()

      const responseId = crypto.randomUUID()

      const { error: responseError } = await supabase
        .from('responses')
        .insert({
          id: responseId,
          service_id: formData.service_id,
          period_id: period?.id,
          is_anonymous: formData.is_anonymous,
          respondent_name: formData.respondent_name,
          respondent_contact: formData.respondent_contact,
          respondent_address: formData.respondent_address,
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

      const demoEntries = Object.entries(demographics).map(([field_id, value]) => ({
        response_id: responseId,
        field_id,
        value,
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

      const answerEntries = Object.entries(answers).map(([questionId, ratingValue]) => {
        const question = allQuestions.find((q) => q.id === questionId)
        return {
          response_id: responseId,
          question_id: questionId,
          unsur_id: question?.unsur_id || '',
          rating_value: ratingValue,
        }
      })

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
      <PublicNavbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 leading-snug flex items-start sm:items-center gap-2.5">
              <ListTodo className="size-5 sm:size-6 text-emerald-600 shrink-0 mt-1 sm:mt-0" />
              <span>Kuesioner Survei Indeks Persepsi Kualitas Pelayanan (IPKP) dan Indeks Persepsi Anti Korupsi (IPAK) {getCurrentPeriodText()}</span>
            </h1>
            <div className="bg-[#eef2fa] border border-blue-200 rounded-lg p-3 sm:p-5 text-blue-900 shadow-sm flex items-start gap-2.5 sm:gap-3">
              <Info className="size-5 sm:size-6 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-base leading-relaxed">
                Untuk mengisi <strong>SURVEI INDEKS PERSEPSI KUALITAS PELAYANAN (IPKP), {getCurrentPeriodText()}</strong><br className="hidden sm:block"/>
                Pada <strong>KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA</strong>, silakan lengkapi formulir di bawah ini
              </p>
            </div>
          </div>
          
          <div className="mb-6 sm:mb-8 flex items-center justify-center gap-1 sm:gap-2 bg-gray-50 border border-gray-100 p-3 sm:p-4 rounded-xl overflow-x-auto">
            {Array.from({ length: totalSteps }, (_, i) => {
              const isCompleted = canStepProceed(i)
              const isReachable = i <= step || Array.from({ length: i }, (_, j) => j).every(j => canStepProceed(j))
              return (
                <div key={i} className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => isReachable && goToStep(i)}
                    className={`flex size-7 sm:size-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${
                      i === step
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                        : i < step && isCompleted
                        ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                        : isReachable
                        ? 'bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isReachable}
                    title={!isReachable ? 'Selesaikan langkah sebelumnya terlebih dahulu' : ''}
                  >
                    {i + 1}
                  </button>
                  {i < totalSteps - 1 && (
                    <div className={`h-0.5 w-3 sm:w-8 transition-colors shrink-0 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
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
              <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                <CardHeader>
                  <CardTitle>{t('survey.select_service')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>{t('survey.select_service')}</Label>
                    <Controller
                      name="service_id"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => v !== null && field.onChange(v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('survey.select_service_placeholder')}>
                              {field.value ? services.find((s) => s.id === field.value)?.name : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {services.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="py-2 text-sm cursor-pointer">
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.service_id && (
                      <p className="text-sm text-destructive">{t(errors.service_id.message as string)}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          {t('survey.name')} <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name="respondent_name"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              placeholder="Masukkan nama lengkap Anda..." 
                              {...field} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '')
                                const titleCase = val.replace(/\b\w/g, c => c.toUpperCase())
                                field.onChange(titleCase)
                              }}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="size-4 text-muted-foreground" />
                          Kontak (HP/WhatsApp) <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name="respondent_contact"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              type="tel"
                              maxLength={13}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                            />
                          )}
                        />
                        {respondentContact.length > 0 && respondentContact.length < 10 && (
                          <p className="text-xs text-destructive">Kontak minimal 10 digit angka</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="size-4 text-muted-foreground" />
                          Alamat Lengkap <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name="respondent_address"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              placeholder="Masukkan alamat lengkap Anda..." 
                              {...field}
                              onChange={(e) => {
                                const titleCase = e.target.value.replace(/\b\w/g, c => c.toUpperCase())
                                field.onChange(titleCase)
                              }}
                            />
                          )}
                        />
                      </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border p-4 bg-gray-50/50">
                    <Controller
                      name="is_anonymous"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <div>
                      <Label className="font-medium flex items-center gap-1.5">
                        <ShieldAlert className="size-4 text-amber-500" />
                        {t('survey.anonymous')}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('survey.anonymous_desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                <CardHeader>
                  <CardTitle>{t('survey.demographic_info')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {demographicFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {locale === 'id' ? field.label_id : field.label_en}
                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.field_type === 'select' ? (
                        <Select
                          value={demographics[field.id] || ''}
                          onValueChange={(v) => v !== null && handleDemographicChange(field.id, v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`-- ${locale === 'id' ? 'Pilih' : 'Select'} --`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.demographic_options?.map((opt) => (
                              <SelectItem key={opt.id} value={opt.value}>
                                {locale === 'id' ? opt.label_id : opt.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.field_type === 'number' ? 'number' : 'text'}
                          value={demographics[field.id] || ''}
                          onChange={(e) => handleDemographicChange(field.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                <CardHeader className="text-center py-6">
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">{t('survey.ipkp_section')}</CardTitle>
                  <CardDescription className="text-base font-semibold text-gray-700 mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                    Nilai 1 <Star className="size-4 fill-yellow-400 text-yellow-400 -mt-0.5" /> (Tidak Baik) 
                    <span className="mx-1">-</span> 
                    Nilai 4 <Star className="size-4 fill-yellow-400 text-yellow-400 -mt-0.5" /> (Sangat Baik)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {ipkpUnsur.map((unsur) => (
                    <div key={unsur.id}>
                      <h3 className="mb-3 font-semibold">{unsur.name}</h3>
                      <div className="space-y-4">
                        {unsur.questions.map((q) => (
                          <div key={q.id} className="flex flex-col gap-2 rounded-lg border p-4">
                            <p className="text-sm">
                              {locale === 'id' ? q.question_text_id : q.question_text_en}
                            </p>
                            <StarRating
                              value={answers[q.id] || 0}
                              onChange={(v) => handleAnswerChange(q.id, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-dashed border-gray-200">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <svg className="size-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                      Saran &amp; Kritik
                      <span className="font-normal text-muted-foreground text-xs">(opsional)</span>
                    </Label>
                    <Textarea
                      value={ipkpFeedback}
                      onChange={(e) => setIpkpFeedback(e.target.value)}
                      placeholder="Tuliskan saran atau kritik Anda terkait kualitas pelayanan..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                <CardHeader className="text-center py-6">
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">{t('survey.ipak_section')}</CardTitle>
                  <CardDescription className="text-base font-semibold text-gray-700 mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                    Nilai 1 <Star className="size-4 fill-yellow-400 text-yellow-400 -mt-0.5" /> (Tidak Baik) 
                    <span className="mx-1">-</span> 
                    Nilai 4 <Star className="size-4 fill-yellow-400 text-yellow-400 -mt-0.5" /> (Sangat Baik)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {ipakUnsur.map((unsur) => (
                    <div key={unsur.id}>
                      <h3 className="mb-3 font-semibold">{unsur.name}</h3>
                      <div className="space-y-4">
                        {unsur.questions.map((q) => (
                          <div key={q.id} className="flex flex-col gap-2 rounded-lg border p-4">
                            <p className="text-sm">
                              {locale === 'id' ? q.question_text_id : q.question_text_en}
                            </p>
                            <StarRating
                              value={answers[q.id] || 0}
                              onChange={(v) => handleAnswerChange(q.id, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-dashed border-gray-200">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <svg className="size-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                      Saran &amp; Kritik
                      <span className="font-normal text-muted-foreground text-xs">(opsional)</span>
                    </Label>
                    <Textarea
                      value={ipakFeedback}
                      onChange={(e) => setIpakFeedback(e.target.value)}
                      placeholder="Tuliskan saran atau kritik Anda terkait pencegahan korupsi..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <div className="space-y-4">
                {/* Ringkasan Data Responden */}
                <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="size-4 text-emerald-600" />
                      Data Responden
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y divide-gray-100 text-sm">
                      <div className="flex justify-between py-2">
                        <dt className="text-muted-foreground">Jenis Layanan</dt>
                        <dd className="font-medium text-right">{services.find(s => s.id === selectedServiceId)?.name || '-'}</dd>
                      </div>
                      {isAnonymous ? (
                        <div className="flex justify-between py-2">
                          <dt className="text-muted-foreground">Identitas</dt>
                          <dd className="font-medium flex items-center gap-1.5 text-amber-600">
                            <ShieldAlert className="size-3.5" /> Anonim
                          </dd>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between py-2">
                            <dt className="text-muted-foreground">Nama</dt>
                            <dd className="font-medium">{respondentName || '-'}</dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-muted-foreground">Kontak (HP/WhatsApp)</dt>
                            <dd className="font-medium">{respondentContact || '-'}</dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-muted-foreground">Alamat</dt>
                            <dd className="font-medium text-right max-w-[60%]">{respondentAddress || '-'}</dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Ringkasan Kelengkapan Jawaban */}
                <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListTodo className="size-4 text-emerald-600" />
                      Kelengkapan Jawaban
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y divide-gray-100 text-sm">
                      <div className="flex justify-between py-2">
                        <dt className="text-muted-foreground">IPKP (Kualitas Pelayanan)</dt>
                        <dd className="font-medium">
                          {(() => {
                            const qs = ipkpUnsur.flatMap(u => u.questions)
                            const filled = qs.filter(q => answers[q.id] && answers[q.id] > 0).length
                            const total = qs.length
                            return (
                              <span className={filled === total ? 'text-emerald-600' : 'text-red-500'}>
                                {filled}/{total} pertanyaan terisi
                              </span>
                            )
                          })()}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2">
                        <dt className="text-muted-foreground">IPAK (Anti Korupsi)</dt>
                        <dd className="font-medium">
                          {(() => {
                            const qs = ipakUnsur.flatMap(u => u.questions)
                            const filled = qs.filter(q => answers[q.id] && answers[q.id] > 0).length
                            const total = qs.length
                            return (
                              <span className={filled === total ? 'text-emerald-600' : 'text-red-500'}>
                                {filled}/{total} pertanyaan terisi
                              </span>
                            )
                          })()}
                        </dd>
                      </div>
                      {ipkpFeedback && (
                        <div className="flex justify-between py-2">
                          <dt className="text-muted-foreground">Saran IPKP</dt>
                          <dd className="font-medium text-emerald-600">✓ Diisi</dd>
                        </div>
                      )}
                      {ipakFeedback && (
                        <div className="flex justify-between py-2">
                          <dt className="text-muted-foreground">Saran IPAK</dt>
                          <dd className="font-medium text-emerald-600">✓ Diisi</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Peringatan */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                  <svg className="size-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-sm text-amber-800">
                    Dengan mengklik tombol <strong>&ldquo;Kirim Survei&rdquo;</strong>, Anda menyatakan bahwa seluruh jawaban yang diberikan adalah benar dan jujur. Data akan digunakan untuk peningkatan kualitas pelayanan publik.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(step - 1)}
            disabled={step === 0}
            className="rounded-full px-6 transition-all duration-300 hover:shadow-sm active:scale-95 group"
          >
            <ChevronLeft className="mr-2 size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {t('common.back')}
          </Button>

          {step < totalSteps - 1 ? (
            <Button 
              type="button" 
              onClick={() => goToStep(step + 1)}
              disabled={!canProceed()}
              className="rounded-full px-8 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 group"
            >
              Lanjut
              <ChevronRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!canProceed() || submitting || !submitReady}
              className="rounded-full px-8 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 group"
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              )}
              {t('common.submit')}
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
