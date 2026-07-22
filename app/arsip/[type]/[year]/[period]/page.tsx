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

export default function ArsipPage() {
  const params = useParams()
  const type = (params?.type as string) || 'ipkp'
  const yearStr = (params?.year as string) || new Date().getFullYear().toString()
  const period = (params?.period as string) || 'tahunan'
  
  const indexType = type.toUpperCase() === 'IPAK' ? 'IPAK' : 'IPKP'
  
  const { t, locale } = useI18n()
  const isEn = locale === 'en'

  let periodName = ''
  switch (period) {
    case 'q1': periodName = isEn ? 'Quarter 1' : 'Triwulan I'; break;
    case 'q2': periodName = isEn ? 'Quarter 2' : 'Triwulan II'; break;
    case 'q3': periodName = isEn ? 'Quarter 3' : 'Triwulan III'; break;
    case 'q4': periodName = isEn ? 'Quarter 4' : 'Triwulan IV'; break;
    case 'sem1': periodName = isEn ? 'Semester 1' : 'Semester 1'; break;
    case 'sem2': periodName = isEn ? 'Semester 2' : 'Semester 2'; break;
    case 'tahunan': periodName = isEn ? 'Annual' : 'Tahunan'; break;
  }
  
  const pageTitle = `${indexType === 'IPAK' ? 'Indeks Persepsi Anti Korupsi (IPAK)' : 'Indeks Persepsi Kualitas Pelayanan (IPKP)'}`
  const tableTitle = `${indexType === 'IPAK' ? 'Indeks Persepsi Anti Korupsi (IPAK)' : 'Indeks Persepsi Kualitas Pelayanan (IPKP)'}`
  const [summary, setSummary] = useState<IndexSummary[]>([])
  const [byService, setByService] = useState<IndexByService[]>([])
  const [trend, setTrend] = useState<IndexTrend[]>([])
  const [unsurSummary, setUnsurSummary] = useState<UnsurSummary[]>([])
  const [demoSummary, setDemoSummary] = useState<DemographicSummary[]>([])
  const [allServices, setAllServices] = useState<{ id: string, name: string }[]>([])
  const [totalResponses, setTotalResponses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('all')

  const getDates = (y: string, p: string) => {
    let startDate = `${y}-01-01`
    let endDate = `${y}-12-31`
    
    if (p === 'q1') {
      startDate = `${y}-01-01`
      endDate = `${y}-03-31`
    } else if (p === 'q2') {
      startDate = `${y}-04-01`
      endDate = `${y}-06-30`
    } else if (p === 'q3') {
      startDate = `${y}-07-01`
      endDate = `${y}-09-30`
    } else if (p === 'q4') {
      startDate = `${y}-10-01`
      endDate = `${y}-12-31`
    } else if (p === 'sem1') {
      startDate = `${y}-01-01`
      endDate = `${y}-06-30`
    } else if (p === 'sem2') {
      startDate = `${y}-07-01`
      endDate = `${y}-12-31`
    }
    
    return {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.999Z`
    }
  }

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const dates = getDates(yearStr, period)

      const [summaryRes, byServiceRes, trendRes, countRes, unsurRes, demoRes, servicesRes] = await Promise.all([
        supabase.rpc('fn_index_summary', { p_start_date: dates.start, p_end_date: dates.end }),
        supabase.rpc('fn_index_summary_by_service', { p_start_date: dates.start, p_end_date: dates.end }),
        supabase.rpc('fn_index_trend', { p_start_date: dates.start, p_end_date: dates.end }),
        supabase.from('responses').select('id', { count: 'exact', head: true }).gte('submitted_at', dates.start).lte('submitted_at', dates.end),
        supabase.rpc('fn_unsur_summary', { p_start_date: dates.start, p_end_date: dates.end }),
        supabase.rpc('fn_demographic_summary', { p_start_date: dates.start, p_end_date: dates.end }),
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
  }, [yearStr, period])

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
          { name: 'Laki-laki', value: totalResponses > 0 ? totalResponses : 0 },
          { name: 'Perempuan', value: 0 },
        ]
      }
      return []
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {isEn ? `Archive: ${pageTitle}` : `Arsip ${pageTitle}`}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  {periodName} {yearStr}
                </span>
                <p className="text-sm text-gray-500">{t('home.total_responses')}: <span className="font-semibold text-emerald-600">{totalResponses.toLocaleString()} {isEn ? 'Respondents' : 'Responden'}</span></p>
              </div>
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
                KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA {periodName.toUpperCase()} {yearStr}
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
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-5">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">{t('results.breakdown')}</CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Rincian perbandingan nilai konversi per layanan</p>
              </CardHeader>
              <CardContent className="p-5">
                {loading ? (
                  <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={parseBarData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} interval={0} angle={-25} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', fontWeight: 600 }} />
                      <Bar dataKey="IPKP" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="IPAK" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-5">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">{t('results.trend')}</CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Tren {periodName} {yearStr}</p>
              </CardHeader>
              <CardContent className="p-5">
                {loading ? (
                  <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="bulan" tick={{ fontSize: 11, fontWeight: 700 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', fontWeight: 600 }} />
                      <Line type="monotone" dataKey="nilai_konversi" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 6 }} />
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
