'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/components/shared/I18nProvider'
import { NILAI_MUTU } from '@/lib/constants'
import type { IndexSummary, IndexByService, UnsurSummary, DemographicSummary } from '@/types'

interface DetailedBreakdownProps {
  indexType: 'IPKP' | 'IPAK'
  serviceFilter: string
  summary: IndexSummary[]
  byService: IndexByService[]
  unsurSummary: UnsurSummary[]
  demoSummary: DemographicSummary[]
}

export function DetailedBreakdown({ indexType, serviceFilter, summary, byService, unsurSummary, demoSummary }: DetailedBreakdownProps) {
  const { locale } = useI18n()

  // 1. Calculate Score Data
  const scoreData = useMemo(() => {
    if (serviceFilter === 'all') {
      const s = summary.find(s => s.index_type === indexType)
      return s ? { konversi: s.nilai_konversi, mutu: s.mutu, nilai_index: s.nilai_index } : null
    }
    const s = byService.find(s => s.index_type === indexType && s.service_name === serviceFilter)
    return s ? { konversi: s.nilai_konversi, mutu: s.mutu, nilai_index: s.nilai_index } : null
  }, [indexType, serviceFilter, summary, byService])

  // 2. Aggregate Unsur Data
  const unsurData = useMemo(() => {
    let filtered = unsurSummary.filter(u => u.index_type === indexType)
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(u => u.service_name === serviceFilter)
    }

    // Group by unsur_id
    const grouped = new Map<string, { unsur_name: string, jumlah_pertanyaan: number, total_nilai: number, jumlah_responden: number }>()
    for (const item of filtered) {
      if (!grouped.has(item.unsur_id)) {
        grouped.set(item.unsur_id, {
          unsur_name: item.unsur_name,
          jumlah_pertanyaan: item.jumlah_pertanyaan,
          total_nilai: 0,
          jumlah_responden: 0
        })
      }
      const g = grouped.get(item.unsur_id)!
      g.total_nilai += Number(item.total_nilai) || 0
      g.jumlah_responden += Number(item.jumlah_responden) || 0
    }

    const result = Array.from(grouped.values()).map(g => {
      const rataRata = g.jumlah_responden > 0 ? g.total_nilai / g.jumlah_responden : 0
      const tertimbang = rataRata / grouped.size // assuming grouped.size is the total unsur count for this index
      return {
        ...g,
        rataRata,
        tertimbang
      }
    })
    
    return result.sort((a, b) => a.unsur_name.localeCompare(b.unsur_name))
  }, [indexType, serviceFilter, unsurSummary])

  // 3. Aggregate Demographic Data
  const demoData = useMemo(() => {
    let filtered = demoSummary
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(d => d.service_name === serviceFilter)
    }

    const grouped = new Map<string, { label: string, options: { value: string, count: number }[] }>()
    for (const item of filtered) {
      if (!grouped.has(item.field_key)) {
        grouped.set(item.field_key, { label: item.field_key, options: [] })
      }
      const g = grouped.get(item.field_key)!
      const opt = g.options.find(o => o.value === item.demographic_value)
      if (opt) {
        opt.count += Number(item.count) || 0
      } else {
        g.options.push({ value: item.demographic_value, count: Number(item.count) || 0 })
      }
    }

    // Sort fields according to common order (Jenis Kelamin, Pendidikan, Pekerjaan, Usia)
    const fieldOrder = ['jenis_kelamin', 'pendidikan', 'pekerjaan', 'usia']
    const result = Array.from(grouped.values()).sort((a, b) => {
      return fieldOrder.indexOf(a.label.toLowerCase()) - fieldOrder.indexOf(b.label.toLowerCase())
    })

    return result
  }, [serviceFilter, demoSummary])

  if (!scoreData) return <div className="p-8 text-center text-gray-500">Belum ada data survei untuk filter ini.</div>

  const totalRespondents = unsurData.length > 0 ? unsurData[0].jumlah_responden : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Table Unsur */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 p-6">
          <CardTitle className="text-center text-sm sm:text-base text-slate-900 dark:text-white font-extrabold uppercase leading-relaxed">
            Rekapitulasi Nilai Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}
            <br/><span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{serviceFilter === 'all' ? 'Semua Layanan' : serviceFilter}</span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
              <TableRow className="border-b border-slate-100 dark:border-gray-800">
                <TableHead className="w-14 font-extrabold text-slate-700 uppercase tracking-wider text-center">No</TableHead>
                <TableHead className="font-extrabold text-slate-700 uppercase tracking-wider">Unsur</TableHead>
                <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider">Jumlah Pertanyaan</TableHead>
                <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider">Total Nilai</TableHead>
                <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider border-x border-slate-100 dark:border-gray-800">Nilai Rata-Rata Unsur</TableHead>
                <TableHead className="text-center font-extrabold text-slate-700 uppercase tracking-wider border-x border-slate-100 dark:border-gray-800">Nilai Rata-Rata Tertimbang Unsur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unsurData.map((u, i) => (
                <TableRow key={i} className="hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors">
                  <TableCell className="text-center font-mono font-bold text-slate-400 text-xs">{i + 1}</TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{u.unsur_name}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{u.jumlah_pertanyaan}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{u.total_nilai}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">{u.rataRata.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">{u.tertimbang.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50/80 dark:bg-gray-800/60 font-extrabold text-xs">
                <TableCell colSpan={5} className="text-center text-slate-700 dark:text-slate-300">Indeks Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}</TableCell>
                <TableCell className="text-center text-emerald-700 dark:text-emerald-400">{scoreData.nilai_index.toFixed(2)} ({locale === 'id' ? NILAI_MUTU[scoreData.mutu]?.label_id : NILAI_MUTU[scoreData.mutu]?.label_en})</TableCell>
              </TableRow>
              <TableRow className="bg-slate-50/80 dark:bg-gray-800/60 font-extrabold text-xs">
                <TableCell colSpan={5} className="text-center text-slate-700 dark:text-slate-300">Konversi</TableCell>
                <TableCell className="text-center text-emerald-700 dark:text-emerald-400">{scoreData.konversi.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="bg-slate-50/80 dark:bg-gray-800/60 font-extrabold text-xs">
                <TableCell colSpan={5} className="text-center text-slate-700 dark:text-slate-300">Mutu Pelayanan</TableCell>
                <TableCell className="text-center text-emerald-700 dark:text-emerald-400">{scoreData.mutu} ({locale === 'id' ? NILAI_MUTU[scoreData.mutu]?.label_id : NILAI_MUTU[scoreData.mutu]?.label_en})</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Unified Score and Demographics Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        <div className="text-center py-6 px-4 bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase leading-relaxed">
            Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}<br/>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA TAHUN 2026</span>
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white font-extrabold text-xs sm:text-sm">
          <div className="w-full sm:w-1/2 text-center py-3 px-4 border-b sm:border-b-0 sm:border-r border-white/20 uppercase tracking-wide">
            Nilai Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}
          </div>
          <div className="w-full sm:w-1/2 text-center py-3 px-4 uppercase tracking-wide">
            {serviceFilter === 'all' ? 'Semua Pelayanan' : serviceFilter}
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-gray-800">
            <h3 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-none">{scoreData.konversi.toFixed(2)}</h3>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm sm:text-base font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {scoreData.mutu} ({locale === 'id' ? NILAI_MUTU[scoreData.mutu]?.label_id : NILAI_MUTU[scoreData.mutu]?.label_en})
            </span>
          </div>
          <div className="w-full md:w-1/2 bg-slate-50/50 dark:bg-gray-800/20">
            <Table>
              <TableBody>
                <TableRow className="bg-slate-100/60 dark:bg-gray-800/50">
                  <TableCell className="font-extrabold w-1/3 text-slate-800 dark:text-slate-200 text-xs">Responden</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400">Jumlah Responden</TableCell>
                  <TableCell className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{totalRespondents} Orang</TableCell>
                </TableRow>
                {demoData.filter(d => ['jenis_kelamin', 'pendidikan'].includes(d.label.toLowerCase())).map((d, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                      {d.label.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {d.options.map((opt) => (
                        <div key={opt.value} className="mb-1 last:mb-0">
                          {opt.value} : <span className="font-bold text-emerald-600 dark:text-emerald-400">{opt.count} Orang</span>
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20 overflow-x-auto">
          <Table>
            <TableBody>
              {demoData.filter(d => ['pekerjaan', 'usia'].includes(d.label.toLowerCase())).map((d, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-gray-800/60 w-[150px] capitalize text-xs">
                    {d.label.replace(/_/g, ' ')}
                  </TableCell>
                  {d.options.map(opt => (
                    <TableCell key={opt.value} className="text-center align-top min-w-[120px]">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">{opt.value}</div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{opt.count} Orang</div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
