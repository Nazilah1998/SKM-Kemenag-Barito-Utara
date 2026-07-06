'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { FileSpreadsheet, FileText, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/components/shared/I18nProvider'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { Footer } from '@/components/shared/Footer'
import { DetailedBreakdown } from '@/components/shared/DetailedBreakdown'
import { createClient } from '@/lib/supabase/client'
import { exportToExcel, exportToPdf } from '@/lib/export'
import type { IndexSummary, IndexByService, IndexTrend, UnsurSummary, DemographicSummary } from '@/types'
import { toast } from 'sonner'

export default function HasilPage() {
  const params = useParams()
  const type = (params?.type as string) || 'ipkp'
  const indexType = type.toUpperCase() === 'IPAK' ? 'IPAK' : 'IPKP'
  const pageTitle = indexType === 'IPAK' ? 'Indeks Persepsi Anti Korupsi (IPAK)' : 'Indeks Persepsi Kualitas Pelayanan (IPKP)'
  const tableTitle = indexType === 'IPAK' ? 'Indeks Persepsi Anti Korupsi (IPAK)' : 'Indeks Persepsi Kualitas Pelayanan (IPKP)'

  const { t } = useI18n()
  const [summary, setSummary] = useState<IndexSummary[]>([])
  const [byService, setByService] = useState<IndexByService[]>([])
  const [trend, setTrend] = useState<IndexTrend[]>([])
  const [unsurSummary, setUnsurSummary] = useState<UnsurSummary[]>([])
  const [demoSummary, setDemoSummary] = useState<DemographicSummary[]>([])
  const [allServices, setAllServices] = useState<{ id: string, name: string }[]>([])
  const [totalResponses, setTotalResponses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('all')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const [summaryRes, byServiceRes, trendRes, countRes, unsurRes, demoRes, servicesRes] = await Promise.all([
        supabase.from('vw_index_summary').select('*'),
        supabase.from('vw_index_summary_by_service').select('*'),
        supabase.from('vw_index_trend').select('*').order('bulan', { ascending: true }),
        supabase.from('responses').select('id', { count: 'exact', head: true }),
        supabase.from('vw_unsur_summary').select('*'),
        supabase.from('vw_demographic_summary').select('*'),
        supabase.from('services').select('*').eq('is_active', true).order('name', { ascending: true }),
      ])

      if (summaryRes.data) setSummary(summaryRes.data as IndexSummary[])
      if (byServiceRes.data) setByService(byServiceRes.data as IndexByService[])
      if (trendRes.data) setTrend(trendRes.data as IndexTrend[])
      if (unsurRes.data) setUnsurSummary(unsurRes.data as UnsurSummary[])
      if (demoRes.data) setDemoSummary(demoRes.data as DemographicSummary[])
      if (servicesRes.data) setAllServices(servicesRes.data)
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
        supabase.from('vw_index_summary_by_service').select('*').then(({ data }) => {
          if (data) setByService(data as IndexByService[])
        })

        supabase.from('vw_unsur_summary').select('*').then(({ data }) => {
          if (data) setUnsurSummary(data as UnsurSummary[])
        })
        supabase.from('vw_demographic_summary').select('*').then(({ data }) => {
          if (data) setDemoSummary(data as DemographicSummary[])
        })
        supabase.from('responses').select('*', { count: 'exact', head: true }).then(({ count }) => {
          if (count !== null) setTotalResponses(count)
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const uniqueServices = Array.from(new Set(byService.map((s) => s.service_name))).sort()

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

  const getMutuDescription = (mutu: string) => {
    if (!mutu || mutu === '-') return 'Belum Terisi Survey'
    switch (mutu) {
      case 'A': return 'Sangat Baik'
      case 'B': return 'Baik'
      case 'C': return 'Kurang Baik'
      case 'D': return 'Tidak Baik'
      default: return 'Belum Terisi Survey'
    }
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
        <div className="mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 pt-8 pb-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hasil Survei {pageTitle}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('home.total_responses')}: <span className="font-semibold text-emerald-600">{totalResponses.toLocaleString()}</span></p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Filter Layanan */}
              <div className="flex items-center w-full sm:w-[350px]">
                <div className="bg-emerald-50 border border-emerald-100 rounded-l-md px-3 py-2 flex items-center justify-center border-r-0 h-10">
                  <Filter className="size-4 text-emerald-600" />
                </div>
                <Select value={serviceFilter} onValueChange={(v) => v !== null && setServiceFilter(v)}>
                  <SelectTrigger className="w-full bg-white border-gray-200 rounded-l-none h-10">
                    <SelectValue placeholder={t('results.filter_service')}>
                      {serviceFilter === 'all' ? t('results.all_services') : serviceFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('results.all_services')}</SelectItem>
                    {uniqueServices.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex-1 sm:flex-auto">
                  <FileSpreadsheet className="mr-2 size-4" />
                  {t('results.export_excel')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf} className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex-1 sm:flex-auto">
                  <FileText className="mr-2 size-4" />
                  {t('results.export_pdf')}
                </Button>
              </div>
            </div>
          </div>

          <Card className="mb-12 shadow-lg border-0 bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 py-4">
              <CardTitle className="text-center text-base md:text-lg text-gray-800 font-medium uppercase leading-snug">
                Rekapitulasi Data Survei {tableTitle} Per Layanan<br/>
                KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA TAHUN 2026
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[60px] font-bold text-gray-900 text-center">NO</TableHead>
                    <TableHead className="font-bold text-gray-900">Nama Layanan</TableHead>
                    <TableHead className="text-center font-bold text-gray-900 whitespace-nowrap">Nilai Indeks Pelayanan</TableHead>
                    <TableHead className="text-center font-bold text-gray-900">Konversi</TableHead>
                    <TableHead className="text-center font-bold text-gray-900 whitespace-nowrap">Mutu Pelayanan</TableHead>
                    <TableHead className="text-center font-bold text-gray-900 whitespace-nowrap">Jumlah Responden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : allServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Belum ada layanan aktif
                      </TableCell>
                    </TableRow>
                  ) : (
                    allServices
                      .map((service, i) => {
                        const item = byService.find(b => b.service_id === service.id && b.index_type === indexType)
                        const hasData = item && item.jumlah_responden > 0
                        return (
                          <TableRow key={service.id} className="hover:bg-gray-50/50">
                            <TableCell className="text-center">{i + 1}</TableCell>
                            <TableCell className="font-medium text-gray-700 min-w-[250px]">
                              {service.name}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {hasData ? `${item.nilai_index.toFixed(2)} (${getMutuDescription(item.mutu)})` : '0.00 (Belum Terisi Survey)'}
                            </TableCell>
                            <TableCell className="text-center">
                              {hasData ? item.nilai_konversi.toFixed(2) : '0.00'}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {hasData ? `${item.mutu} (${getMutuDescription(item.mutu)})` : 'Belum Terisi Survey'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item ? item.jumlah_responden : 0} {item && item.jumlah_responden > 0 ? 'Orang' : ''}
                            </TableCell>
                          </TableRow>
                        )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="mb-12 space-y-12">
            <DetailedBreakdown 
              indexType={indexType} 
              serviceFilter={serviceFilter} 
              summary={summary} 
              byService={byService} 
              unsurSummary={unsurSummary} 
              demoSummary={demoSummary} 
            />
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
