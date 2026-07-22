'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { FileSpreadsheet, FileText, Filter, Users, GraduationCap, UserCheck, Briefcase } from 'lucide-react'
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

  const { t, locale } = useI18n()
  const [summary, setSummary] = useState<IndexSummary[]>([])
  const [byService, setByService] = useState<IndexByService[]>([])
  const [trend, setTrend] = useState<IndexTrend[]>([])
  const [unsurSummary, setUnsurSummary] = useState<UnsurSummary[]>([])
  const [demoSummary, setDemoSummary] = useState<DemographicSummary[]>([])
  const [allServices, setAllServices] = useState<{ id: string, name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('all')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const [summaryRes, byServiceRes, trendRes, unsurRes, demoRes, servicesRes] = await Promise.all([
        supabase.from('vw_index_summary').select('*'),
        supabase.from('vw_index_summary_by_service').select('*'),
        supabase.from('vw_index_trend').select('*').order('bulan', { ascending: true }),
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
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const uniqueServices = Array.from(new Set(byService.map((s) => s.service_name))).sort()

  const displayedServices = serviceFilter === 'all'
    ? allServices
    : allServices.filter(s => s.name === serviceFilter)

  const currentByService = serviceFilter === 'all'
    ? byService.filter(item => item.index_type === indexType)
    : byService.filter(item => item.index_type === indexType && item.service_name === serviceFilter)

  const activeTotalResponses = currentByService.reduce((acc, item) => acc + (item.jumlah_responden || 0), 0)

  const parseUnsurBarData = () => {
    let filtered = unsurSummary.filter((u) => u.index_type === indexType)
    if (serviceFilter !== 'all') {
      filtered = filtered.filter((u) => u.service_name === serviceFilter)
    }

    const grouped = new Map<string, { total: number, count: number }>()
    for (const item of filtered) {
      const shortName = item.unsur_name.length > 18 ? `${item.unsur_name.substring(0, 16)}...` : item.unsur_name
      if (!grouped.has(shortName)) {
        grouped.set(shortName, { total: 0, count: 0 })
      }
      const g = grouped.get(shortName)!
      g.total += Number(item.total_nilai) || 0
      g.count += Number(item.jumlah_responden) || 0
    }

    return Array.from(grouped.entries()).map(([name, data]) => {
      const avg = data.count > 0 ? data.total / data.count : 0
      const konversi = avg * 25
      return {
        name,
        'Nilai Konversi': Number(konversi.toFixed(2)),
      }
    })
  }

  const parseTrendData = () => {
    return trend.map((t) => {
      let dateLabel = t.bulan
      try {
        const d = new Date(t.bulan)
        if (!isNaN(d.getTime())) {
          dateLabel = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
        }
      } catch {
        dateLabel = t.bulan
      }
      return {
        ...t,
        bulanLabel: dateLabel,
        'Nilai Konversi': Number((t.nilai_konversi || 0).toFixed(2)),
      }
    })
  }

  const parseDemoFieldData = (fieldKey: string) => {
    let filtered = demoSummary.filter((d) => d.field_key.toLowerCase() === fieldKey.toLowerCase())
    if (serviceFilter !== 'all') {
      filtered = filtered.filter((d) => d.service_name === serviceFilter)
    }

    const map = new Map<string, number>()
    for (const item of filtered) {
      const val = item.demographic_value || 'Lainnya'
      map.set(val, (map.get(val) || 0) + Number(item.count || 0))
    }

    if (map.size === 0) {
      if (fieldKey === 'jenis_kelamin') {
        return [
          { name: 'Laki-laki', value: activeTotalResponses > 0 ? activeTotalResponses : 0 },
          { name: 'Perempuan', value: 0 },
        ]
      }
      return []
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }

  const getMutuDescription = (mutu: string) => {
    if (!mutu || mutu === '-') return locale === 'en' ? 'No Data' : 'Belum Terisi'
    switch (mutu) {
      case 'A': return locale === 'en' ? 'Very Good' : 'Sangat Baik'
      case 'B': return locale === 'en' ? 'Good' : 'Baik'
      case 'C': return locale === 'en' ? 'Fair' : 'Kurang Baik'
      case 'D': return locale === 'en' ? 'Poor' : 'Tidak Baik'
      default: return locale === 'en' ? 'No Data' : 'Belum Terisi'
    }
  }

  async function handleExportExcel() {
    try {
      await exportToExcel(summary, byService, activeTotalResponses)
      toast.success(locale === 'en' ? 'Successfully exported to Excel' : 'Berhasil mengekspor ke Excel')
    } catch {
      toast.error(locale === 'en' ? 'Failed to export Excel' : 'Gagal mengekspor Excel')
    }
  }

  async function handleExportPdf() {
    try {
      await exportToPdf(summary, byService, activeTotalResponses)
      toast.success(locale === 'en' ? 'Successfully exported to PDF' : 'Berhasil mengekspor ke PDF')
    } catch {
      toast.error(locale === 'en' ? 'Failed to export PDF' : 'Gagal mengekspor PDF')
    }
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex-1 bg-slate-50/60 dark:bg-gray-950 pb-12">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-8 pb-12">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {locale === 'en' ? `Survey Results: ${pageTitle}` : `Hasil Survei ${pageTitle}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t('home.total_responses')}: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{activeTotalResponses.toLocaleString()} {locale === 'en' ? 'Respondents' : 'Responden'}</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Layanan */}
              <div className="flex items-center w-full sm:w-[320px]">
                <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 rounded-l-2xl px-3.5 py-2.5 flex items-center justify-center border-r-0 h-11 shrink-0">
                  <Filter className="size-4 text-emerald-600" />
                </div>
                <Select value={serviceFilter} onValueChange={(v) => v !== null && setServiceFilter(v)}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 rounded-l-none rounded-r-2xl h-11 font-semibold text-xs sm:text-sm">
                    <SelectValue placeholder={t('results.filter_service')}>
                      {serviceFilter === 'all' ? t('results.all_services') : serviceFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl p-1 shadow-xl max-h-72">
                    <SelectItem value="all" className="rounded-xl font-bold">{t('results.all_services')}</SelectItem>
                    {uniqueServices.map((s) => (
                      <SelectItem key={s} value={s} className="rounded-xl font-medium">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-11 rounded-2xl border-slate-200 dark:border-gray-700 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer">
                  <FileSpreadsheet className="mr-2 size-4 text-emerald-600" />
                  {t('results.export_excel')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf} className="h-11 rounded-2xl border-slate-200 dark:border-gray-700 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer">
                  <FileText className="mr-2 size-4 text-emerald-600" />
                  {t('results.export_pdf')}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <Card className="mb-10 border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-6">
              <CardTitle className="text-center text-sm sm:text-base text-slate-900 dark:text-white font-extrabold uppercase tracking-wide leading-relaxed">
                Rekapitulasi Data Survei {tableTitle} Per Layanan<br/>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA TAHUN 2026</span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
                  <TableRow className="border-b border-slate-100 dark:border-gray-800">
                    <TableHead className="w-14 font-extrabold text-slate-700 uppercase tracking-wider text-center">NO</TableHead>
                    <TableHead className="font-extrabold text-slate-700 uppercase tracking-wider">Nama Layanan</TableHead>
                    <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider whitespace-nowrap">Nilai Indeks</TableHead>
                    <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider">Konversi</TableHead>
                    <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider whitespace-nowrap">Mutu Pelayanan</TableHead>
                    <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider whitespace-nowrap">Jumlah Responden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                        Memuat data survei...
                      </TableCell>
                    </TableRow>
                  ) : displayedServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                        Belum ada layanan aktif
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedServices.map((service, i) => {
                      const item = byService.find(b => b.service_id === service.id && b.index_type === indexType)
                      const hasData = item && item.jumlah_responden > 0
                      const mutuText = getMutuDescription(item?.mutu || '')

                      return (
                        <TableRow key={service.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="text-center font-mono font-bold text-slate-400 text-xs">{i + 1}</TableCell>
                          <TableCell className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs sm:text-sm">
                            {hasData ? item.nilai_index.toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell className="text-center font-mono font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                            {hasData ? item.nilai_konversi.toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasData ? (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                                item.mutu === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                item.mutu === 'B' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                                item.mutu === 'C' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {item.mutu} ({mutuText})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                                Belum Terisi
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs">
                            {item ? (
                              <span className={item.jumlah_responden > 0 ? 'text-emerald-700 font-black' : 'text-slate-400'}>
                                {item.jumlah_responden} Orang
                              </span>
                            ) : '0 Orang'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="mb-10 space-y-10">
            <DetailedBreakdown 
              indexType={indexType} 
              serviceFilter={serviceFilter} 
              summary={summary} 
              byService={byService} 
              unsurSummary={unsurSummary} 
              demoSummary={demoSummary} 
            />
          </div>

          {/* TOP: 4 Demographic Charts (Jenis Kelamin, Pendidikan, Usia, Pekerjaan) */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Jenis Kelamin */}
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-4">
                <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <Users className="size-4 text-cyan-500" />
                  <span>Jenis Kelamin <span className="text-slate-400 font-normal">Responden</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
                {loading ? (
                  <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={parseDemoFieldData('jenis_kelamin')}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {parseDemoFieldData('jenis_kelamin').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#06b6d4', '#ec4899', '#f59e0b', '#10b981'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '14px', fontWeight: 600, fontSize: '11px' }} />
                      <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 2. Pendidikan */}
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-4">
                <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <GraduationCap className="size-4 text-amber-500" />
                  <span>Pendidikan <span className="text-slate-400 font-normal">Responden</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
                {loading ? (
                  <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={parseDemoFieldData('pendidikan')}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} interval={0} angle={-35} textAnchor="end" height={55} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '14px', fontWeight: 600, fontSize: '11px' }} />
                      <Bar dataKey="value" name="Jumlah" radius={[6, 6, 0, 0]}>
                        {parseDemoFieldData('pendidikan').map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'][index % 8]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 3. Usia */}
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-4">
                <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <UserCheck className="size-4 text-rose-500" />
                  <span>Usia <span className="text-slate-400 font-normal">Responden</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
                {loading ? (
                  <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={parseDemoFieldData('usia')}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} interval={0} angle={-35} textAnchor="end" height={55} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '14px', fontWeight: 600, fontSize: '11px' }} />
                      <Bar dataKey="value" name="Jumlah" radius={[6, 6, 0, 0]}>
                        {parseDemoFieldData('usia').map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#f43f5e', '#ec4899', '#f59e0b', '#eab308', '#84cc16'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 4. Pekerjaan */}
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-4">
                <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <Briefcase className="size-4 text-teal-500" />
                  <span>Pekerjaan <span className="text-slate-400 font-normal">Responden</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
                {loading ? (
                  <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={parseDemoFieldData('pekerjaan')}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} interval={0} angle={-35} textAnchor="end" height={55} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '14px', fontWeight: 600, fontSize: '11px' }} />
                      <Bar dataKey="value" name="Jumlah" radius={[6, 6, 0, 0]}>
                        {parseDemoFieldData('pekerjaan').map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'][index % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* BOTTOM: 1 Baris dengan 2 Chart (Rincian Nilai Konversi Per Unsur & Tren Nilai) */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Rincian Per Unsur (Bar Chart) */}
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-5">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Rincian Nilai Konversi Per Unsur ({indexType})
                </CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Nilai rata-rata konversi (skala 0 - 100) untuk tiap unsur indikator</p>
              </CardHeader>
              <CardContent className="p-5">
                {loading ? (
                  <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={parseUnsurBarData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} interval={0} angle={-25} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', fontWeight: 600, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="Nilai Konversi" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Tren Nilai Bulanan (Line Chart) */}
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-5">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">{t('results.trend')}</CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Menampilkan tren perkembangan indeks konversi secara berkala</p>
              </CardHeader>
              <CardContent className="p-5">
                {loading ? (
                  <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={parseTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="bulanLabel" tick={{ fontSize: 11, fontWeight: 700 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', fontWeight: 600 }} />
                      <Line type="monotone" dataKey="Nilai Konversi" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 6 }} />
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
