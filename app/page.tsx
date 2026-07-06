'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ClipboardCheck, Users, ArrowRight, FileText } from 'lucide-react'
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

      const { count } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })

      if (idxData) setSummary(idxData)
      if (count !== null) setTotalResponses(count)
      setLoading(false)
    }
    fetchData()
  }, [])

  const ipkp = summary.find((s) => s.index_type === 'IPKP')
  const ipak = summary.find((s) => s.index_type === 'IPAK')

  function getGradeColor(mutu: string) {
    const colors: Record<string, string> = {
      A: 'text-green-600 bg-green-50 border-green-200',
      B: 'text-blue-600 bg-blue-50 border-blue-200',
      C: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      D: 'text-red-600 bg-red-50 border-red-200',
    }
    return colors[mutu] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex-1 bg-gray-50/50">
        <PageBanner
          title={t('home.hero_title')}
          description={t('home.hero_desc')}
          eyebrow="Sistem Informasi Kepuasan dan Aspirasi Publik"
        >
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/survei">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100 shadow-lg">
                <ClipboardCheck className="mr-2 size-5" />
                {t('home.start_survey')}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/hasil">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg">
                <FileText className="mr-2 size-5" />
                {t('home.view_results')}
              </Button>
            </Link>
          </div>
        </PageBanner>

        <section className="relative z-10 mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 -mt-8 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-emerald-500 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="size-5 text-emerald-600" />
                    {t('home.ipkp_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                {loading ? (
                  <div className="h-12 animate-pulse rounded bg-gray-200" />
                ) : ipkp ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{ipkp.nilai_konversi.toFixed(2)}</span>
                      <Badge className={getGradeColor(ipkp.mutu)}>
                        {ipkp.mutu}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {locale === 'id' ? NILAI_MUTU[ipkp.mutu]?.label_id : NILAI_MUTU[ipkp.mutu]?.label_en}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('results.no_data')}</p>
                )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-blue-500 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="size-5 text-blue-600" />
                    {t('home.ipak_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                {loading ? (
                  <div className="h-12 animate-pulse rounded bg-gray-200" />
                ) : ipak ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{ipak.nilai_konversi.toFixed(2)}</span>
                      <Badge className={getGradeColor(ipak.mutu)}>
                        {ipak.mutu}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {locale === 'id' ? NILAI_MUTU[ipak.mutu]?.label_id : NILAI_MUTU[ipak.mutu]?.label_en}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('results.no_data')}</p>
                )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-purple-500 bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="size-5 text-purple-600" />
                    {t('home.total_responses')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-center">
                {loading ? (
                  <div className="h-12 animate-pulse rounded bg-gray-200" />
                ) : (
                  <span className="text-3xl font-bold">{totalResponses.toLocaleString()}</span>
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


