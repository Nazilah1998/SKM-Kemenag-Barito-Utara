'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, ShieldCheck, Users, ArrowRight, FileText, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: idxData } = await supabase
        .from('vw_index_summary')
        .select('*')
        .returns<IndexSummary[]>()

      const { data: byServiceData } = await supabase
        .from('vw_index_summary_by_service')
        .select('index_type, jumlah_responden')

      if (idxData) setSummary(idxData)
      if (byServiceData) {
        const count = byServiceData
          .filter(item => item.index_type === 'IPKP')
          .reduce((acc, item) => acc + (item.jumlah_responden || 0), 0)
        setTotalResponses(count)
      }
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
        supabase.from('vw_index_summary_by_service').select('index_type, jumlah_responden').then(({ data }) => {
          if (data) {
            const count = data.filter(item => item.index_type === 'IPKP').reduce((acc, item) => acc + (item.jumlah_responden || 0), 0)
            setTotalResponses(count)
          }
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const ipkp = summary.find((s) => s.index_type === 'IPKP')
  const ipak = summary.find((s) => s.index_type === 'IPAK')

  function getGradeColor(mutu: string) {
    const colors: Record<string, string> = {
      A: 'text-emerald-700 bg-emerald-50 border-emerald-200/80 font-bold',
      B: 'text-blue-700 bg-blue-50 border-blue-200/80 font-bold',
      C: 'text-amber-700 bg-amber-50 border-amber-200/80 font-bold',
      D: 'text-rose-700 bg-rose-50 border-rose-200/80 font-bold',
    }
    return colors[mutu] || 'text-slate-600 bg-slate-50 border-slate-200'
  }

  const getCurrentPeriodText = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    let quarter = 'I'
    if (month >= 4 && month <= 6) quarter = 'II'
    else if (month >= 7 && month <= 9) quarter = 'III'
    else if (month >= 10 && month <= 12) quarter = 'IV'
    return `Triwulan ${quarter} Tahun ${year}`
  }

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

        <section className="relative z-10 mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 -mt-12 pb-6">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* IPKP Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl hover:-translate-y-1">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="flex flex-col items-center justify-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shadow-inner">
                      <Award className="size-6" />
                    </div>
                    <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-200 mt-1">
                      {t('home.ipkp_title')}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center text-center pb-6">
                {loading ? (
                  <div className="h-12 w-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                ) : ipkp ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{ipkp.nilai_konversi.toFixed(2)}</span>
                      <Badge className={`px-2.5 py-0.5 rounded-full text-xs ${getGradeColor(ipkp.mutu)}`}>
                        {ipkp.mutu}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-slate-500">
                      {locale === 'id' ? NILAI_MUTU[ipkp.mutu]?.label_id : NILAI_MUTU[ipkp.mutu]?.label_en}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black text-slate-300 dark:text-slate-700">0.00</span>
                      <Badge className="text-slate-400 bg-slate-100 border-slate-200">-</Badge>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-400">Belum ada data survei</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

            {/* IPAK Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl hover:-translate-y-1">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="flex flex-col items-center justify-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 shadow-inner">
                      <ShieldCheck className="size-6" />
                    </div>
                    <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-200 mt-1">
                      {t('home.ipak_title')}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center text-center pb-6">
                {loading ? (
                  <div className="h-12 w-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                ) : ipak ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{ipak.nilai_konversi.toFixed(2)}</span>
                      <Badge className={`px-2.5 py-0.5 rounded-full text-xs ${getGradeColor(ipak.mutu)}`}>
                        {ipak.mutu}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-slate-500">
                      {locale === 'id' ? NILAI_MUTU[ipak.mutu]?.label_id : NILAI_MUTU[ipak.mutu]?.label_en}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black text-slate-300 dark:text-slate-700">0.00</span>
                      <Badge className="text-slate-400 bg-slate-100 border-slate-200">-</Badge>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-400">Belum ada data survei</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Responden Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl hover:-translate-y-1 h-full">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="flex flex-col items-center justify-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 shadow-inner">
                      <Users className="size-6" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-200 mt-1">
                        {t('home.total_responses')}
                      </div>
                      <div className="text-[11px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full mt-1 border border-purple-200/80 inline-block">
                        {getCurrentPeriodText()}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center justify-center text-center pb-6">
                {loading ? (
                  <div className="h-12 w-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                ) : (
                  <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalResponses.toLocaleString('id-ID')}
                  </span>
                )}
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}


