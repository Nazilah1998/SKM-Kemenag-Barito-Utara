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
      <Card className="shadow-lg border-0 bg-white overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-center text-lg text-gray-800 leading-snug">
            Rekapitulasi Nilai Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}
            <br/><span className="text-sm font-normal text-gray-500">{serviceFilter === 'all' ? 'Semua Layanan' : serviceFilter}</span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[50px] font-bold text-gray-900 text-center">No</TableHead>
                <TableHead className="font-bold text-gray-900">Unsur</TableHead>
                <TableHead className="text-center font-bold text-gray-900">Jumlah Pertanyaan</TableHead>
                <TableHead className="text-center font-bold text-gray-900">Total Nilai</TableHead>
                <TableHead className="text-center font-bold text-gray-900 border-x">Nilai Rata-Rata Unsur</TableHead>
                <TableHead className="text-center font-bold text-gray-900 border-x">Nilai Rata-Rata Tertimbang Unsur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unsurData.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center">{i + 1}</TableCell>
                  <TableCell>{u.unsur_name}</TableCell>
                  <TableCell className="text-center">{u.jumlah_pertanyaan}</TableCell>
                  <TableCell className="text-center">{u.total_nilai}</TableCell>
                  <TableCell className="text-center">{u.rataRata.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{u.tertimbang.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableCell colSpan={5} className="text-center text-gray-700">Indeks Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}</TableCell>
                <TableCell className="text-center font-bold">{scoreData.nilai_index.toFixed(2)} ({locale === 'id' ? NILAI_MUTU[scoreData.mutu]?.label_id : NILAI_MUTU[scoreData.mutu]?.label_en})</TableCell>
              </TableRow>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableCell colSpan={5} className="text-center text-gray-700">Konversi</TableCell>
                <TableCell className="text-center font-bold">{scoreData.konversi.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableCell colSpan={5} className="text-center text-gray-700">Mutu Pelayanan</TableCell>
                <TableCell className="text-center font-bold">{scoreData.mutu} ({locale === 'id' ? NILAI_MUTU[scoreData.mutu]?.label_id : NILAI_MUTU[scoreData.mutu]?.label_en})</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Unified Score and Demographics Card */}
      <Card className="shadow-lg border-0 bg-white overflow-hidden rounded-xl border-blue-200 border-[1px]">
        <div className="text-center py-6 px-4 bg-white">
          <h2 className="text-lg md:text-xl font-normal text-gray-800 uppercase leading-snug">
            Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}<br/>
            KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA<br/>
            Tahun 2026
          </h2>
        </div>
        
        <div className="flex w-full bg-red-600 text-white font-bold text-sm md:text-base">
          <div className="w-full md:w-1/2 text-center py-3 px-4 border-r border-red-500/30 uppercase">
            Nilai Survei {indexType === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}
          </div>
          <div className="w-full md:w-1/2 text-center py-3 px-4 uppercase">
            {serviceFilter === 'all' ? 'Semua Pelayanan' : serviceFilter}
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
            <h3 className="text-7xl md:text-[100px] font-black text-gray-900 mb-6 tracking-tighter leading-none">{scoreData.konversi.toFixed(2)}</h3>
            <p className="text-2xl md:text-3xl font-bold text-gray-800">{scoreData.mutu} ({locale === 'id' ? NILAI_MUTU[scoreData.mutu]?.label_id : NILAI_MUTU[scoreData.mutu]?.label_en})</p>
          </div>
          <div className="w-full md:w-1/2 bg-gray-50/30">
            <Table>
              <TableBody>
                <TableRow className="bg-gray-100/50">
                  <TableCell className="font-bold w-1/3 text-gray-800">Responden</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium text-gray-600">Jumlah Responden</TableCell>
                  <TableCell className="text-sm text-gray-800">{totalRespondents} Orang</TableCell>
                </TableRow>
                {demoData.filter(d => ['jenis_kelamin', 'pendidikan'].includes(d.label.toLowerCase())).map((d, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm font-medium text-gray-600 capitalize">
                      {d.label.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-800">
                      {d.options.map((opt) => (
                        <div key={opt.value} className="mb-1 last:mb-0">
                          {opt.value} : {opt.count} Orang
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/50 overflow-x-auto">
          <Table>
            <TableBody>
              {demoData.filter(d => ['pekerjaan', 'usia'].includes(d.label.toLowerCase())).map((d, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-gray-800 bg-gray-100/80 w-[150px] capitalize">
                    {d.label.replace(/_/g, ' ')}
                  </TableCell>
                  {d.options.map(opt => (
                    <TableCell key={opt.value} className="text-center align-top min-w-[120px]">
                      <div className="text-sm font-semibold text-gray-700 mb-1">{opt.value}</div>
                      <div className="text-sm text-gray-500">{opt.count} Orang</div>
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
