'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Turnstile } from '@marsidev/react-turnstile'
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/components/shared/I18nProvider'
import { StarRating } from '@/components/shared/StarRating'
import { SurveyThankYou } from '@/components/shared/SurveyThankYou'
import PageBanner from '@/components/shared/PageBanner'
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
})

type FormValues = z.infer<typeof formSchema>

export default function SurveiPage() {
  const { t, locale } = useI18n()
  const [step, setStep] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [period, setPeriod] = useState<SurveyPeriod | null>(null)
  const [ipkpUnsur, setIpkpUnsur] = useState<UnsurWithQuestions[]>([])
  const [ipakUnsur, setIpakUnsur] = useState<UnsurWithQuestions[]>([])
  const [demographicFields, setDemographicFields] = useState<DemographicField[]>([])
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [demographics, setDemographics] = useState<Record<string, string>>({})

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { service_id: '', is_anonymous: true, respondent_name: '', respondent_contact: '' },
  })

  const isAnonymous = useWatch({ control, name: 'is_anonymous' })
  const selectedServiceId = useWatch({ control, name: 'service_id' })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const [servicesRes, periodsRes, unsurRes, fieldsRes, settingsRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('survey_periods').select('*').eq('is_active', true).single(),
        supabase.from('unsur').select('*, questions(*)').eq('is_active', true).order('sort_order'),
        supabase.from('demographic_fields').select('*, demographic_options(*)').eq('is_active', true).order('sort_order'),
        supabase.from('app_settings').select('value').eq('key', 'turnstile_site_key').single(),
      ])

      if (servicesRes.data) setServices(servicesRes.data as Service[])
      if (periodsRes.data) setPeriod(periodsRes.data as SurveyPeriod)
      if (settingsRes.data) setTurnstileSiteKey(settingsRes.data.value)

      const unsurData = (unsurRes.data || []) as unknown as UnsurWithQuestions[]
      setIpkpUnsur(unsurData.filter((u) => u.index_type === 'IPKP'))
      setIpakUnsur(unsurData.filter((u) => u.index_type === 'IPAK'))

      if (fieldsRes.data) setDemographicFields(fieldsRes.data as DemographicField[])

      setLoading(false)
    }
    fetchData()
  }, [])

  const allQuestions = [...ipkpUnsur.flatMap((u) => u.questions), ...ipakUnsur.flatMap((u) => u.questions)]
  const totalSteps = 5

  const canProceed = useCallback(() => {
    if (step === 0) return !!selectedServiceId
    if (step === 1) return true
    if (step === 2) {
      const ipkpQuestions = ipkpUnsur.flatMap((u) => u.questions)
      return ipkpQuestions.every((q) => answers[q.id] && answers[q.id] > 0)
    }
    if (step === 3) {
      const ipakQuestions = ipakUnsur.flatMap((u) => u.questions)
      return ipakQuestions.every((q) => answers[q.id] && answers[q.id] > 0)
    }
    if (step === 4) return !!turnstileToken
    return true
  }, [step, selectedServiceId, answers, ipkpUnsur, ipakUnsur, turnstileToken])

  async function onSubmit(formData: FormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()

      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert({
          service_id: formData.service_id,
          period_id: period?.id,
          is_anonymous: formData.is_anonymous,
          respondent_name: formData.is_anonymous ? null : formData.respondent_name || null,
          respondent_contact: formData.is_anonymous ? null : formData.respondent_contact || null,
          locale,
          turnstile_verified: true,
        })
        .select('id')
        .single()

      if (responseError || !responseData) {
        toast.error(t('survey.error_submit'))
        setSubmitting(false)
        return
      }

      const responseId = responseData.id

      const demoEntries = Object.entries(demographics).map(([field_id, value]) => ({
        response_id: responseId,
        field_id,
        value,
      }))

      if (demoEntries.length > 0) {
        await supabase.from('response_demographics').insert(demoEntries)
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
        await supabase.from('response_answers').insert(answerEntries)
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
      <main className="flex-1 bg-gray-50/50">
        <PageBanner
          title={t('survey.title')}
          description={period ? `${period.label} (${period.start_date} - ${period.end_date})` : 'Memuat data...'}
          eyebrow="Formulir Survei"
          breadcrumb={[
            { label: 'Beranda', href: '/' },
            { label: 'Survei' }
          ]}
        />
        
        <div className="relative z-10 mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 -mt-8 pb-16">
          <div className="mb-8 flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md border border-white/40 p-4 rounded-2xl shadow-lg ring-1 ring-black/5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    i <= step ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`h-0.5 w-8 transition-colors ${i < step ? 'bg-emerald-600' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl border border-gray-100">
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
                            <SelectValue placeholder={t('survey.select_service_placeholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
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

                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <Controller
                      name="is_anonymous"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <div>
                      <Label className="font-medium">{t('survey.anonymous')}</Label>
                      <p className="text-sm text-muted-foreground">{t('survey.anonymous_desc')}</p>
                    </div>
                  </div>

                  {!isAnonymous && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('survey.name')}</Label>
                        <Controller
                          name="respondent_name"
                          control={control}
                          render={({ field }) => <Input {...field} />}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('survey.contact')}</Label>
                        <Controller
                          name="respondent_contact"
                          control={control}
                          render={({ field }) => <Input {...field} />}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
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
                            {field.options?.map((opt) => (
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
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('survey.ipkp_section')}</CardTitle>
                  <CardDescription>Nilai 1 (Sangat Tidak Baik) - 4 (Sangat Baik)</CardDescription>
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
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('survey.ipak_section')}</CardTitle>
                  <CardDescription>Nilai 1 (Sangat Tidak Baik) - 4 (Sangat Baik)</CardDescription>
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
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Verifikasi Keamanan</CardTitle>
                  <CardDescription>Verifikasi bahwa Anda bukan robot</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  {turnstileSiteKey && (
                    <Turnstile
                      siteKey={turnstileSiteKey}
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 size-4" />
            {t('common.back')}
          </Button>

          {step < totalSteps - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              {t('common.save')}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!canProceed() || submitting}>
              {submitting ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Send className="mr-1 size-4" />
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
