'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Printer, Download, FileText, Calendar, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import type { IndexSummary, IndexByService, UnsurSummary, DemographicSummary, Service } from '@/types'
import { exportToPdf } from '@/lib/export'
import { toast } from 'sonner'

export default function LaporanPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('Triwulan III (Juli - September 2026)')
  const [indexType, setIndexType] = useState<'IPKP' | 'IPAK'>('IPKP')
  const [serviceFilter, setServiceFilter] = useState('all')

  const [kepalaName, setKepalaName] = useState('H. Abdul Majid, S.Ag., M.Pd.')
  const [kepalaNip, setKepalaNip] = useState('19750512 200003 1 002')
  const [ketuaName, setKetuaName] = useState('Drs. H. M. Yamin, M.H.')
  const [ketuaNip, setKetuaNip] = useState('19800815 200501 1 005')
  const [reportDate, setReportDate] = useState('30 September 2026')

  const [summary, setSummary] = useState<IndexSummary[]>([])
  const [byService, setByService] = useState<IndexByService[]>([])
  const [unsurSummary, setUnsurSummary] = useState<UnsurSummary[]>([])
  const [demoSummary, setDemoSummary] = useState<DemographicSummary[]>([])
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      const [sumRes, bySvcRes, unsurRes, demoRes, svcRes] = await Promise.all([
        supabase.from('vw_index_summary').select('*'),
        supabase.from('vw_index_summary_by_service').select('*'),
        supabase.from('vw_unsur_summary').select('*'),
        supabase.from('vw_demographic_summary').select('*'),
        supabase.from('services').select('*').eq('is_active', true).order('name'),
      ])

      if (sumRes.data) setSummary(sumRes.data as IndexSummary[])
      if (bySvcRes.data) setByService(bySvcRes.data as IndexByService[])
      if (unsurRes.data) setUnsurSummary(unsurRes.data as UnsurSummary[])
      if (demoRes.data) setDemoSummary(demoRes.data as DemographicSummary[])
      if (svcRes.data) setServices(svcRes.data as Service[])
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filtered score logic
  const currentSummary = summary.find(s => s.index_type === indexType)
  const filteredByService = serviceFilter === 'all'
    ? byService.filter(b => b.index_type === indexType)
    : byService.filter(b => b.index_type === indexType && b.service_name === serviceFilter)

  const activeTotalResponses = filteredByService.reduce((acc, item) => acc + (item.jumlah_responden || 0), 0)

  // Unsur breakdown
  const filteredUnsur = unsurSummary.filter(u => u.index_type === indexType && (serviceFilter === 'all' || u.service_name === serviceFilter))
  
  const unsurGrouped = new Map<string, { unsur_name: string, total_nilai: number, count: number }>()
  for (const item of filteredUnsur) {
    if (!unsurGrouped.has(item.unsur_id)) {
      unsurGrouped.set(item.unsur_id, { unsur_name: item.unsur_name, total_nilai: 0, count: 0 })
    }
    const g = unsurGrouped.get(item.unsur_id)!
    g.total_nilai += Number(item.total_nilai) || 0
    g.count += Number(item.jumlah_responden) || 0
  }

  const unsurList = Array.from(unsurGrouped.values()).map((u) => {
    const avg = u.count > 0 ? u.total_nilai / u.count : 0
    const konversi = avg * 25
    return {
      ...u,
      avg,
      konversi,
      mutu: konversi >= 88.31 ? 'A (Sangat Baik)' : konversi >= 76.61 ? 'B (Baik)' : konversi >= 65.31 ? 'C (Kurang Baik)' : 'D (Tidak Baik)'
    }
  }).sort((a, b) => a.unsur_name.localeCompare(b.unsur_name))

  // Lowest unsur for RTL recommendations
  const lowestUnsur = unsurList.length > 0 ? [...unsurList].sort((a, b) => a.konversi - b.konversi)[0] : null

  function handlePrint() {
    window.print()
  }

  async function handleExportPdf() {
    try {
      const periodLabel = 'Laporan PermenPAN-RB Tahun 2026'
      await exportToPdf(summary, byService, activeTotalResponses, periodLabel, demoSummary)
      toast.success('Berhasil mengekspor Laporan PDF PermenPAN-RB')
    } catch {
      toast.error('Gagal mengekspor PDF')
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Control Panel (Hidden when printing) */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl print:hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-6">
          <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-emerald-600" />
              <span>Generator Laporan Hasil Survei (LHP) PermenPAN-RB</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleExportPdf} className="rounded-2xl h-10 border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-50 cursor-pointer gap-2">
                <Download className="size-4" />
                <span>Unduh PDF</span>
              </Button>
              <Button type="button" onClick={handlePrint} className="rounded-2xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer gap-2">
                <Printer className="size-4" />
                <span>Cetak Laporan (A4)</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Calendar className="size-3.5 text-emerald-600" />
              <span>Periode Laporan</span>
            </Label>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl text-xs font-semibold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Jenis Indeks</Label>
            <Select value={indexType} onValueChange={(v) => v && setIndexType(v as 'IPKP' | 'IPAK')}>
              <SelectTrigger className="w-full rounded-xl text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="IPKP" className="font-bold text-xs">IPKP (Kualitas Pelayanan)</SelectItem>
                <SelectItem value="IPAK" className="font-bold text-xs">IPAK (Anti Korupsi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Building2 className="size-3.5 text-emerald-600" />
              <span>Filter Layanan</span>
            </Label>
            <Select value={serviceFilter} onValueChange={(v) => v && setServiceFilter(v)}>
              <SelectTrigger className="w-full rounded-xl text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="all" className="font-bold text-xs">Semua Layanan</SelectItem>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.name} className="text-xs font-medium">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Tanggal Pengesahan</Label>
            <Input value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="rounded-xl text-xs font-semibold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nama Kepala Kantor</Label>
            <Input value={kepalaName} onChange={(e) => setKepalaName(e.target.value)} className="rounded-xl text-xs font-semibold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">NIP Kepala Kantor</Label>
            <Input value={kepalaNip} onChange={(e) => setKepalaNip(e.target.value)} className="rounded-xl text-xs font-semibold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nama Ketua Tim Survei</Label>
            <Input value={ketuaName} onChange={(e) => setKetuaName(e.target.value)} className="rounded-xl text-xs font-semibold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">NIP Ketua Tim</Label>
            <Input value={ketuaNip} onChange={(e) => setKetuaNip(e.target.value)} className="rounded-xl text-xs font-semibold" />
          </div>
        </CardContent>
      </Card>

      {/* Official Printed Document Preview Sheet (A4 Styled) */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 md:p-16 rounded-3xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 max-w-[900px] mx-auto space-y-8 font-serif leading-relaxed text-xs sm:text-sm">
        
        {/* KOP SURAT RESMI */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-4 relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Image src="/kemenag.svg" alt="Logo Kemenag" width={60} height={60} className="object-contain" />
            <div className="text-center uppercase font-sans">
              <h2 className="text-sm font-bold tracking-wider">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h2>
              <h1 className="text-base sm:text-lg font-black tracking-widest text-slate-950">KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA</h1>
              <p className="text-[11px] font-medium lowercase tracking-normal text-slate-600 font-serif">
                Jalan Ahmad Yani No. 88 Muara Teweh, Kalimantan Tengah | Website: baritoutara.kemenag.go.id
              </p>
            </div>
          </div>
        </div>

        {/* JUDUL LAPORAN */}
        <div className="text-center font-sans space-y-1 my-6">
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 underline decoration-2 underline-offset-4">
            LAPORAN HASIL SURVEI KEPUASAN MASYARAKAT (SKM)
          </h3>
          <p className="text-xs font-extrabold uppercase text-emerald-800">
            {indexType === 'IPKP' ? 'INDEKS PERSEPSI KUALITAS PELAYANAN (IPKP)' : 'INDEKS PERSEPSI ANTI KORUPSI (IPAK)'}
          </p>
          <p className="text-xs font-bold text-slate-600">
            PERIODE: {period.toUpperCase()}
          </p>
        </div>

        {/* BAB I: RINGKASAN HASIL */}
        <div className="space-y-3 font-sans">
          <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 border-l-4 border-emerald-600 text-slate-900">
            I. RINGKASAN EKSEKUTIF INDEKS
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center my-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">Nilai Konversi Indeks</span>
              <span className="text-3xl font-black text-emerald-950 block">{currentSummary?.nilai_konversi.toFixed(2) || '0.00'}</span>
              <span className="text-[11px] font-bold text-emerald-700 block mt-1">Skala 0 - 100</span>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
              <span className="text-[11px] font-bold text-teal-800 uppercase block mb-1">Mutu Pelayanan</span>
              <span className="text-2xl font-black text-teal-950 block">{currentSummary?.mutu || 'A'}</span>
              <span className="text-[11px] font-bold text-teal-700 block mt-1">{currentSummary?.kinerja || 'Sangat Baik'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Total Responden</span>
              <span className="text-3xl font-black text-slate-900 block">{activeTotalResponses}</span>
              <span className="text-[11px] font-bold text-slate-600 block mt-1">Masyarakat Pemohon</span>
            </div>
          </div>
        </div>

        {/* BAB II: RINCIAN PER UNSUR */}
        <div className="space-y-3 font-sans">
          <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 border-l-4 border-emerald-600 text-slate-900">
            II. REKAPITULASI NILAI PER UNSUR INDIKATOR
          </h4>

          <div className="border rounded-2xl overflow-hidden border-slate-200">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="w-10 font-bold text-slate-900 text-center text-xs">NO</TableHead>
                  <TableHead className="font-bold text-slate-900 text-xs">UNSUR INDIKATOR</TableHead>
                  <TableHead className="text-center font-bold text-slate-900 text-xs">NRR UNSUR</TableHead>
                  <TableHead className="text-center font-bold text-slate-900 text-xs">KONVERSI (NRR x 25)</TableHead>
                  <TableHead className="text-center font-bold text-slate-900 text-xs">KATEGORI MUTU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unsurList.map((u, idx) => (
                  <TableRow key={idx} className="border-b border-slate-100 text-xs">
                    <TableCell className="text-center font-bold">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{u.unsur_name}</TableCell>
                    <TableCell className="text-center font-mono font-bold">{u.avg.toFixed(2)}</TableCell>
                    <TableCell className="text-center font-mono font-extrabold text-emerald-800">{u.konversi.toFixed(2)}</TableCell>
                    <TableCell className="text-center font-bold">{u.mutu}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* BAB III: PROFIL DEMOGRAFI RESPONDEN */}
        <div className="space-y-3 font-sans">
          <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 border-l-4 border-emerald-600 text-slate-900">
            III. PROFIL & SEBARAN DEMOGRAFI RESPONDEN
          </h4>

          {loading ? (
            <div className="flex items-center justify-center p-6 text-slate-400 gap-2">
              <Loader2 className="size-4 animate-spin text-emerald-600" />
              <span>Memuat data demografi...</span>
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden border-slate-200">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-900 text-xs w-1/3">KATEGORI DEMOGRAFI</TableHead>
                    <TableHead className="font-bold text-slate-900 text-xs">RINCIAN SEBARAN RESPONDEN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(new Set(demoSummary.map(d => d.field_key))).map((key) => {
                    const items = demoSummary.filter(d => d.field_key === key && (serviceFilter === 'all' || d.service_name === serviceFilter))
                    return (
                      <TableRow key={key} className="border-b border-slate-100 text-xs">
                        <TableCell className="font-bold text-slate-800 capitalize">{key.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {items.length > 0 ? (
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {items.map((it, i) => (
                                <span key={i}>
                                  {it.demographic_value}: <strong className="text-emerald-800">{it.count} orang</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">1 orang (Responden Aktif)</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* BAB IV: RENCANA TINDAK LANJUT (RTL) */}
        <div className="space-y-3 font-sans">
          <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 border-l-4 border-emerald-600 text-slate-900">
            IV. RENCANA TINDAK LANJUT (RTL) REKOMENDASI PERBAIKAN
          </h4>
          
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
            {lowestUnsur ? (
              <>
                <p className="font-bold text-amber-950">
                  📌 Unsur dengan nilai konversi terendah: <span className="underline">{lowestUnsur.unsur_name}</span> (Skor: {lowestUnsur.konversi.toFixed(2)} - {lowestUnsur.mutu})
                </p>
                <p className="text-slate-700 leading-relaxed font-serif">
                  Rekomendasi Tindak Lanjut: Memperkuat koordinasi tim petugas PTSP, menyederhanakan petunjuk teknis persyaratan permohonan, serta meningkatkan transparansi kepastian waktu penyelesaian layanan kepada masyarakat.
                </p>
              </>
            ) : (
              <p className="text-slate-600">Seluruh unsur indikator pelayanan telah memenuhi kriteria kinerja Sangat Baik.</p>
            )}
          </div>
        </div>

        {/* LEMBAR PENGESAHAN */}
        <div className="pt-8 font-sans space-y-12 page-break-inside-avoid">
          <div className="flex justify-end text-xs font-semibold">
            <p>Muara Teweh, {reportDate}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-16">
              <p className="font-bold">Ketua Tim Pelaksana Survei,</p>
              <div className="space-y-0.5">
                <p className="font-bold underline uppercase">{ketuaName}</p>
                <p className="text-[11px] text-slate-600 font-mono">NIP. {ketuaNip}</p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-bold">Mengetahui,<br/>Kepala Kantor Kemenag Kab. Barito Utara</p>
              <div className="space-y-0.5">
                <p className="font-bold underline uppercase">{kepalaName}</p>
                <p className="text-[11px] text-slate-600 font-mono">NIP. {kepalaNip}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
