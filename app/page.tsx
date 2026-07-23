'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, ShieldCheck, Users, ArrowRight, FileText, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/components/shared/I18nProvider'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import PageBanner from '@/components/shared/PageBanner'
import { Footer } from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'
import { NILAI_MUTU } from '@/lib/constants'
import type { IndexSummary } from '@/types'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { t, locale } = useI18n()
  const [summary, setSummary] = useState<IndexSummary[]>([])
  const [totalResponses, setTotalResponses] = useState(0)
  const [loading, setLoading] = useState(true)

  async function fetchTotalResponses(supabaseClient: ReturnType<typeof createClient>) {
    // Count overall responses across all periods
    const { count } = await supabaseClient
      .from('responses')
      .select('*', { count: 'exact', head: true })

    if (typeof count === 'number') {
      setTotalResponses(count)
    } else {
      const { data: allTotals } = await supabaseClient
        .from('vw_total_responses')
        .select('total_count')

      if (allTotals && allTotals.length > 0) {
        const responseCount = allTotals.reduce((acc, curr) => acc + (curr.total_count || 0), 0)
        setTotalResponses(responseCount)
      }
    }
  }

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: idxData } = await supabase
        .from('vw_index_summary')
        .select('*')
        .returns<IndexSummary[]>()

      if (idxData) setSummary(idxData)
      await fetchTotalResponses(supabase)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'kemenag_survey', table: 'responses' }, () => {
        supabase.from('vw_index_summary').select('*').returns<IndexSummary[]>().then(({ data }) => {
          if (data) setSummary(data)
        })
        fetchTotalResponses(supabase)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const ipkp = summary.find((s) => s.index_type === 'IPKP')
  const ipak = summary.find((s) => s.index_type === 'IPAK')

  return (
    <>
      <PublicNavbar />
      <main className="flex-1 bg-slate-50/70 dark:bg-gray-950">
        <PageBanner
          title={t('home.hero_title')}
          description={t('home.hero_desc')}
          eyebrow={t('common.app_full')}
        >
          <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link href="/survei">
              <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold rounded-2xl px-7 py-6 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all cursor-pointer">
                <ClipboardList className="mr-2.5 size-5 text-emerald-600" />
                <span>{t('home.start_survey')}</span>
                <ArrowRight className="ml-2.5 size-4 text-emerald-600" />
              </Button>
            </Link>
            <Link href="/hasil">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl px-6 py-6 backdrop-blur-md shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
                <FileText className="mr-2.5 size-4 text-emerald-300" />
                <span>{t('home.view_results')}</span>
              </Button>
            </Link>
          </div>
        </PageBanner>

        <section className="relative z-10 mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-4 sm:-mt-6 md:-mt-10 lg:-mt-12 pb-8">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* IPKP Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full"
            >
              <Card className="rounded-3xl border border-slate-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 border border-emerald-200/60 dark:border-emerald-900 group-hover:scale-105 transition-transform">
                      <Award className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 px-2.5 py-1 rounded-full">
                      {locale === 'en' ? 'SERVICE QUALITY' : 'Kualitas Pelayanan'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                      {t('home.ipkp_title')}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {locale === 'en' ? '9 Public Service Assessment Elements' : 'Indeks Evaluasi 9 Unsur Pelayanan Publik'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-baseline justify-between border-t border-slate-100 dark:border-gray-800">
                  {loading ? (
                    <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ) : ipkp ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                          {ipkp.nilai_konversi.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 px-3 py-1 rounded-full">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                          {ipkp.mutu} &bull; {locale === 'id' ? NILAI_MUTU[ipkp.mutu]?.label_id : NILAI_MUTU[ipkp.mutu]?.label_en}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl font-black text-slate-300 font-mono">0.00</span>
                      <Badge className="text-slate-400 bg-slate-100 border-slate-200">{locale === 'en' ? 'No Data Yet' : 'Belum Ada Data'}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* IPAK Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full"
            >
              <Card className="rounded-3xl border border-slate-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 border border-indigo-200/60 dark:border-indigo-900 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 px-2.5 py-1 rounded-full">
                      {locale === 'en' ? 'ANTI-CORRUPTION' : 'Anti Korupsi'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                      {t('home.ipak_title')}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {locale === 'en' ? '5 Anti-Corruption Assessment Elements' : 'Indeks Evaluasi 5 Unsur Anti-Korupsi'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-baseline justify-between border-t border-slate-100 dark:border-gray-800">
                  {loading ? (
                    <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ) : ipak ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                          {ipak.nilai_konversi.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900 px-3 py-1 rounded-full">
                        <span className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                          {ipak.mutu} &bull; {locale === 'id' ? NILAI_MUTU[ipak.mutu]?.label_id : NILAI_MUTU[ipak.mutu]?.label_en}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl font-black text-slate-300 font-mono">0.00</span>
                      <Badge className="text-slate-400 bg-slate-100 border-slate-200">{locale === 'en' ? 'No Data Yet' : 'Belum Ada Data'}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Total Responden Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full"
            >
              <Card className="rounded-3xl border border-slate-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 border border-purple-200/60 dark:border-purple-900 group-hover:scale-105 transition-transform">
                      <Users className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 px-2.5 py-1 rounded-full">
                      {locale === 'en' ? 'PUBLIC PARTICIPATION' : 'Partisipasi Publik'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                      {t('home.total_responses')}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {locale === 'en' ? 'Verified Respondent Count' : 'Jumlah Responden Terverifikasi'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-gray-800">
                  {loading ? (
                    <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                          {totalResponses.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{locale === 'en' ? 'Respondents' : 'Orang'}</span>
                      </div>
                      <div className="text-[11px] font-extrabold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-900">
                        {locale === 'en' ? 'Data Year 2026' : 'Data Tahun 2026'}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}


