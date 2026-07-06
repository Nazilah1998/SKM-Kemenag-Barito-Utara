'use client'

import { useEffect, useState } from 'react'
import { FileSpreadsheet, FileText, Loader2, PieChart, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Service, SurveyPeriod, Unsur, IndexSummary } from '@/types'

export default function AdminLaporanPage() {
  const [services, setServices] = useState<Service[]>([])
  const [periods, setPeriods] = useState<SurveyPeriod[]>([])
  const [unsurList, setUnsurList] = useState<Unsur[]>([])
  const [indexSummary, setIndexSummary] = useState<IndexSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterService, setFilterService] = useState('')
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [servicesRes, periodsRes, unsurRes, indexRes] = await Promise.all([
        supabase.from('services').select('*').order('sort_order'),
        supabase.from('survey_periods').select('*').order('start_date', { ascending: false }),
        supabase.from('unsur').select('*').order('sort_order'),
        supabase.from('vw_index_summary').select('*'),
      ])
      if (servicesRes.data) setServices(servicesRes.data as Service[])
      if (periodsRes.data) setPeriods(periodsRes.data as SurveyPeriod[])
      if (unsurRes.data) setUnsurList(unsurRes.data as Unsur[])
      if (indexRes.data) setIndexSummary(indexRes.data as IndexSummary[])
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  async function handleExportExcel() {
    setGenerating(true)
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()

      for (const indexType of ['IPKP', 'IPAK'] as const) {
        const sheet = workbook.addWorksheet(indexType)
        const unsur = unsurList.filter((u) => u.index_type === indexType && u.is_active)

        const headerRow = sheet.addRow(['LAPORAN INDEKS KEPUASAN MASYARAKAT'])
        sheet.mergeCells(`A${headerRow.number}:E${headerRow.number}`)
        headerRow.font = { bold: true, size: 14 }
        headerRow.alignment = { horizontal: 'center' as const }

        const typeRow = sheet.addRow([`Index Type: ${indexType}`])
        sheet.mergeCells(`A${typeRow.number}:E${typeRow.number}`)
        typeRow.alignment = { horizontal: 'center' as const }

        sheet.addRow([])

        const headers = ['No', 'Unsur', 'NRR', 'Bobot', 'NRR Tertimbang']
        const header = sheet.addRow(headers)
        header.font = { bold: true }
        header.eachCell((cell) => {
          cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE0E0E0' } }
          cell.border = {
            top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
            left: { style: 'thin' as const }, right: { style: 'thin' as const },
          }
        })

        const bobotPerUnsur = unsur.length > 0 ? 1 / unsur.length : 0
        let totalNrr = 0

        for (let i = 0; i < unsur.length; i++) {
          const nrr = 0
          const nrrTertimbang = nrr * bobotPerUnsur
          totalNrr += nrrTertimbang

          const row = sheet.addRow({
            no: i + 1,
            unsur: unsur[i].name,
            nrr: nrr.toFixed(4),
            bobot: bobotPerUnsur.toFixed(4),
            nrr_tertimbang: nrrTertimbang.toFixed(4),
          })
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
              left: { style: 'thin' as const }, right: { style: 'thin' as const },
            }
          })
        }

        const summary = indexSummary.find((s) => s.index_type === indexType)

        sheet.addRow({})
        const totalRow = sheet.addRow({
          no: '', unsur: '', nrr: '',
          bobot: '', nrr_tertimbang: '',
        })
        totalRow.getCell(1).value = ''
        totalRow.getCell(2).value = 'Total'
        totalRow.getCell(4).value = '1.0000'
        totalRow.getCell(5).value = totalNrr.toFixed(4)
        totalRow.font = { bold: true }

        if (summary) {
          sheet.addRow({})
          sheet.addRow([]).getCell(2).value = `Nilai Index: ${summary.nilai_index.toFixed(4)}`
          sheet.addRow([]).getCell(2).value = `Nilai Konversi: ${summary.nilai_konversi.toFixed(2)}`
          sheet.addRow([]).getCell(2).value = `Mutu: ${summary.mutu} (${summary.kinerja})`
        }

        sheet.getColumn(1).width = 5
        sheet.getColumn(2).width = 40
        sheet.getColumn(3).width = 12
        sheet.getColumn(4).width = 10
        sheet.getColumn(5).width = 15
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-ikm-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('File Excel berhasil diexport')
    } catch {
      toast.error('Gagal mengexport file Excel')
    } finally {
      setGenerating(false)
    }
  }

  function handleExportPdf() {
    toast.info('Fitur export PDF akan segera tersedia')
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const ipkpSummary = indexSummary.find((s) => s.index_type === 'IPKP')
  const ipakSummary = indexSummary.find((s) => s.index_type === 'IPAK')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <PieChart className="size-6 text-emerald-600" />
            Laporan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Rekapitulasi hasil indeks kepuasan dan export data.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ipkpSummary && (
          <Card>
            <CardHeader>
              <CardTitle>IPKP</CardTitle>
              <CardDescription>Indeks Persepsi Kualitas Pelayanan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{ipkpSummary.nilai_konversi.toFixed(2)}</div>
              <div className="mt-1 flex items-center gap-2">
                <Badge>{ipkpSummary.mutu}</Badge>
                <span className="text-sm text-muted-foreground">{ipkpSummary.kinerja}</span>
              </div>
            </CardContent>
          </Card>
        )}
        {ipakSummary && (
          <Card>
            <CardHeader>
              <CardTitle>IPAK</CardTitle>
              <CardDescription>Indeks Persepsi Anti Korupsi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{ipakSummary.nilai_konversi.toFixed(2)}</div>
              <div className="mt-1 flex items-center gap-2">
                <Badge>{ipakSummary.mutu}</Badge>
                <span className="text-sm text-muted-foreground">{ipakSummary.kinerja}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border border-gray-100 dark:border-gray-800 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="size-4 text-gray-500" />
            Filter & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Periode</Label>
              <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Layanan</Label>
              <Select value={filterService} onValueChange={(v) => setFilterService(v || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-500/20" onClick={handleExportExcel} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
              Export Excel
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handleExportPdf}>
              <FileText className="size-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="IPKP">
        <TabsList className="mb-4">
          <TabsTrigger value="IPKP">IPKP</TabsTrigger>
          <TabsTrigger value="IPAK">IPAK</TabsTrigger>
        </TabsList>
        {(['IPKP', 'IPAK'] as const).map((indexType) => {
          const filteredUnsur = unsurList.filter((u) => u.index_type === indexType && u.is_active)
          const bobotPerUnsur = filteredUnsur.length > 0 ? 1 / filteredUnsur.length : 0
          return (
            <TabsContent key={indexType} value={indexType}>
              <Card>
                <CardHeader>
                  <CardTitle>Rincian {indexType}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Unsur</TableHead>
                        <TableHead className="w-20 text-center">NRR</TableHead>
                        <TableHead className="w-20 text-center">Bobot</TableHead>
                        <TableHead className="w-28 text-center">NRR Tertimbang</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnsur.map((u, i) => (
                        <TableRow key={u.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">{bobotPerUnsur.toFixed(4)}</TableCell>
                          <TableCell className="text-center">-</TableCell>
                        </TableRow>
                      ))}
                      {filteredUnsur.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-4 text-center text-muted-foreground">
                            Belum ada data unsur
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
