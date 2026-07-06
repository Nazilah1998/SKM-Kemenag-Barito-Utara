'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { FileSpreadsheet, FileText, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/components/shared/I18nProvider'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import PageBanner from '@/components/shared/PageBanner'
import { Footer } from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'
import { NILAI_MUTU } from '@/lib/constants'
import { exportToExcel, exportToPdf } from '@/lib/export'
import type { IndexSummary, IndexByService, IndexTrend } from '@/types'
import { toast } from 'sonner'

export default function HasilPage() {
  const { t, locale } = useI18n()
  const [summary, setSummary] = useState<IndexSummary[]>([])
  const [byService, setByService] = useState<IndexByService[]>([])
  const [trend, setTrend] = useState<IndexTrend[]>([])
  const [totalResponses, setTotalResponses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('all')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const [summaryRes, byServiceRes, trendRes, countRes] = await Promise.all([
        supabase.from('vw_index_summary').select('*'),
        supabase.from('vw_index_summary_by_service').select('*'),
        supabase.from('vw_index_trend').select('*').order('bulan'),
        supabase.from('responses').select('*', { count: 'exact', head: true }),
      ])

      if (summaryRes.data) setSummary(summaryRes.data as IndexSummary[])
      if (byServiceRes.data) setByService(byServiceRes.data as IndexByService[])
      if (trendRes.data) setTrend(trendRes.data as IndexTrend[])
      if (countRes.count !== null) setTotalResponses(countRes.count)

      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('hasil-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'kemenag_survey', table: 'responses' }, () => {
        supabase.from('vw_index_summary').select('*').then(({ data }) => {
          if (data) setSummary(data as IndexSummary[])
        })
        supabase.from('responses').select('*', { count: 'exact', head: true }).then(({ count }) => {
          if (count !== null) setTotalResponses(count)
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const ipkp = summary.find((s) => s.index_type === 'IPKP')
  const ipak = summary.find((s) => s.index_type === 'IPAK')

  function getGradeColor(mutu: string) {
    const map: Record<string, string> = {
      A: 'bg-green-100 text-green-700 border-green-200',
      B: 'bg-blue-100 text-blue-700 border-blue-200',
      C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      D: 'bg-red-100 text-red-700 border-red-200',
    }
    return map[mutu] || 'bg-gray-100 text-gray-700 border-gray-200'
  }


  const uniqueServices = [...new Set(byService.map((b) => b.service_name))]

  const parseBarData = () => {
    const ipkpByService = byService.filter((b) => b.index_type === 'IPKP')
    const ipakByService = byService.filter((b) => b.index_type === 'IPAK')
    
    let allNames = [...new Set([...ipkpByService.map((b) => b.service_name), ...ipakByService.map((b) => b.service_name)])]
    
    if (serviceFilter !== 'all') {
      allNames = allNames.filter((name) => name === serviceFilter)
    }

    return allNames.map((name) => {
      const ipkpEntry = ipkpByService.find((b) => b.service_name === name)
      const ipakEntry = ipakByService.find((b) => b.service_name === name)
      return {
        name,
        IPKP: ipkpEntry?.nilai_konversi || 0,
        IPAK: ipakEntry?.nilai_konversi || 0,
      }
    })
  }

  async function handleExportExcel() {
    try {
      await exportToExcel(summary, byService, totalResponses)
      toast.success('Berhasil mengekspor ke Excel')
    } catch {
      toast.error('Gagal mengekspor Excel')
    }
  }

  async function handleExportPdf() {
    try {
      await exportToPdf(summary, byService, totalResponses)
      toast.success('Berhasil mengekspor ke PDF')
    } catch {
      toast.error('Gagal mengekspor PDF')
    }
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex-1 bg-gray-50/50">
        <PageBanner
          title={t('results.title')}
          description={`${t('home.total_responses')}: ${totalResponses.toLocaleString()}`}
          eyebrow="Dashboard Hasil Survei"
          breadcrumb={[
            { label: 'Beranda', href: '/' },
            { label: 'Hasil Survei' }
          ]}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 size-4" />
              {t('results.export_excel')}
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm" onClick={handleExportPdf}>
              <FileText className="mr-2 size-4" />
              {t('results.export_pdf')}
            </Button>
          </div>
        </PageBanner>

        <div className="relative z-10 mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 -mt-8 pb-16">
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <Card className="border-t-4 border-t-emerald-500 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-700">{t('results.ipkp_score')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-16 animate-pulse rounded bg-gray-200" />
                ) : ipkp ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold">{ipkp.nilai_konversi.toFixed(2)}</span>
                    <Badge className={getGradeColor(ipkp.mutu)}>
                      {ipkp.mutu} - {locale === 'id' ? NILAI_MUTU[ipkp.mutu]?.label_id : NILAI_MUTU[ipkp.mutu]?.label_en}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('results.no_data')}</p>
                )}
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-blue-500 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700">{t('results.ipak_score')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-16 animate-pulse rounded bg-gray-200" />
                ) : ipak ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold">{ipak.nilai_konversi.toFixed(2)}</span>
                    <Badge className={getGradeColor(ipak.mutu)}>
                      {ipak.mutu} - {locale === 'id' ? NILAI_MUTU[ipak.mutu]?.label_id : NILAI_MUTU[ipak.mutu]?.label_en}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('results.no_data')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={serviceFilter} onValueChange={(v) => v !== null && setServiceFilter(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('results.filter_service')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('results.all_services')}</SelectItem>
                  {uniqueServices.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle>{t('results.breakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 animate-pulse rounded bg-gray-200" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={parseBarData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 4]} />
                      <Tooltip />
                      <Bar dataKey="IPKP" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="IPAK" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle>{t('results.trend')}</CardTitle>
                <p className="text-xs text-muted-foreground font-normal mt-1">Menampilkan tren global keseluruhan</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 animate-pulse rounded bg-gray-200" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 4]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="nilai_konversi" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669' }} />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
