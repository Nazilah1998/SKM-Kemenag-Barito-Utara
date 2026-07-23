import React from 'react'
import ExcelJS from 'exceljs'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { IndexSummary, IndexByService, DemographicSummary } from '@/types'
import { SurveyReport } from '@/components/pdf/SurveyReport'

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportToExcel(
  summary: IndexSummary[],
  byService: IndexByService[],
  totalResponses: number,
  periodName?: string,
  demoSummary?: DemographicSummary[]
) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SI-ARUS Kemenag Barito Utara'
  workbook.created = new Date()

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'D1D5DB' } },
    left: { style: 'thin', color: { argb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
    right: { style: 'thin', color: { argb: 'D1D5DB' } },
  }

  // ==========================================
  // WORKSHEET 1: RINGKASAN & RINCIAN PER LAYANAN
  // ==========================================
  const ws1 = workbook.addWorksheet('Laporan SKM')

  // Header Banner Title
  ws1.mergeCells('A1:E1')
  ws1.getCell('A1').value = 'LAPORAN SURVEI KEPUASAN MASYARAKAT (SKM)'
  ws1.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: '065F46' } }

  ws1.mergeCells('A2:E2')
  ws1.getCell('A2').value = 'KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA'
  ws1.getCell('A2').font = { name: 'Arial', size: 11, bold: true, color: { argb: '475569' } }

  ws1.mergeCells('A3:E3')
  ws1.getCell('A3').value = `PERIODE: ${(periodName || 'TAHUN 2026').toUpperCase()}  |  TOTAL RESPONDEN: ${totalResponses} RESPONDEN`
  ws1.getCell('A3').font = { name: 'Arial', size: 9, bold: true, color: { argb: '047857' } }

  // Blank row
  ws1.addRow([])

  // Section 1 Header
  const sec1Row = ws1.addRow(['1. RINGKASAN INDEKS KEPUASAN & ANTI KORUPSI'])
  sec1Row.font = { name: 'Arial', size: 10, bold: true, color: { argb: '1E293B' } }
  ws1.addRow([])

  // Table 1 Header
  const th1 = ws1.addRow(['Jenis Indeks', 'Nilai Indeks (1-4)', 'Nilai Konversi (25-100)', 'Mutu Pelayanan', 'Kinerja Unit'])
  th1.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } }
  th1.alignment = { vertical: 'middle', horizontal: 'center' }
  th1.height = 24

  th1.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '065F46' } }
    cell.border = thinBorder
  })

  // Table 1 Data
  summary.forEach((s) => {
    const row = ws1.addRow([
      s.index_type === 'IPKP' ? 'IPKP (Kualitas Pelayanan)' : 'IPAK (Anti Korupsi)',
      Number(s.nilai_index),
      Number(s.nilai_konversi),
      s.mutu,
      s.kinerja,
    ])
    row.height = 20
    row.font = { name: 'Arial', size: 9 }

    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(2).numFmt = '0.0000'

    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(3).font = { name: 'Arial', size: 9, bold: true, color: { argb: '059669' } }
    row.getCell(3).numFmt = '0.00'

    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(4).font = { name: 'Arial', size: 9, bold: true }

    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }

    row.eachCell((c) => { c.border = thinBorder })
  })

  ws1.addRow([])
  ws1.addRow([])

  // Section 2 Header
  const sec2Row = ws1.addRow(['2. REKAPITULASI RINCIAN INDEKS PER LAYANAN'])
  sec2Row.font = { name: 'Arial', size: 10, bold: true, color: { argb: '1E293B' } }
  ws1.addRow([])

  // Table 2 Header
  const th2 = ws1.addRow(['No', 'Nama Layanan', 'Jenis Indeks', 'Nilai Konversi', 'Mutu Pelayanan'])
  th2.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } }
  th2.alignment = { vertical: 'middle', horizontal: 'center' }
  th2.height = 24

  th2.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '047857' } }
    cell.border = thinBorder
  })

  // Table 2 Data
  byService.forEach((b, idx) => {
    const isAlt = idx % 2 === 1
    const row = ws1.addRow([
      idx + 1,
      b.service_name,
      b.index_type,
      Number(b.nilai_konversi),
      b.mutu,
    ])
    row.height = 19
    row.font = { name: 'Arial', size: 9 }

    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(3).font = { name: 'Arial', size: 9, bold: true }

    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: '047857' } }
    row.getCell(4).numFmt = '0.00'

    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(5).font = { name: 'Arial', size: 9, bold: true }

    row.eachCell((c) => {
      c.border = thinBorder
      if (isAlt) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } }
      }
    })
  })

  // Set Column Widths for WS1
  ws1.getColumn(1).width = 30
  ws1.getColumn(2).width = 45
  ws1.getColumn(3).width = 25
  ws1.getColumn(4).width = 20
  ws1.getColumn(5).width = 25


  // ==========================================
  // WORKSHEET 2: DEMOGRAFI RESPONDEN
  // ==========================================
  if (demoSummary && demoSummary.length > 0) {
    const ws2 = workbook.addWorksheet('Demografi Responden')

    ws2.mergeCells('A1:D1')
    ws2.getCell('A1').value = 'DEMOGRAFI RESPONDEN SURVEI'
    ws2.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: '065F46' } }

    ws2.mergeCells('A2:D2')
    ws2.getCell('A2').value = `PERIODE: ${(periodName || 'TAHUN 2026').toUpperCase()}`
    ws2.getCell('A2').font = { name: 'Arial', size: 10, bold: true, color: { argb: '475569' } }

    ws2.addRow([])

    const fields = [
      { key: 'jenis_kelamin', title: '1. Demografi Jenis Kelamin' },
      { key: 'usia', title: '2. Demografi Kelompok Usia' },
      { key: 'pendidikan', title: '3. Demografi Pendidikan Terakhir' },
      { key: 'pekerjaan', title: '4. Demografi Pekerjaan' },
    ]

    fields.forEach((f) => {
      const filtered = demoSummary.filter((d) => d.field_key.toLowerCase() === f.key)
      if (filtered.length === 0) return

      const map = new Map<string, number>()
      let total = 0
      for (const item of filtered) {
        const val = item.demographic_value || 'Lainnya'
        const count = Number(item.count || 0)
        map.set(val, (map.get(val) || 0) + count)
        total += count
      }

      const categoryTitleRow = ws2.addRow([f.title])
      categoryTitleRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: '065F46' } }

      const thDemo = ws2.addRow(['Kategori / Pilihan', 'Jumlah Responden', 'Persentase (%)'])
      thDemo.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } }
      thDemo.alignment = { vertical: 'middle', horizontal: 'center' }
      thDemo.height = 22

      thDemo.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }
        c.border = thinBorder
      })

      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([label, count]) => {
          const pct = total > 0 ? count / total : 0
          const r = ws2.addRow([label, count, pct])
          r.height = 19
          r.font = { name: 'Arial', size: 9 }

          r.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
          r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
          r.getCell(2).numFmt = '#,##0'

          r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
          r.getCell(3).font = { name: 'Arial', size: 9, bold: true, color: { argb: '0284C7' } }
          r.getCell(3).numFmt = '0.0%'

          r.eachCell((c) => { c.border = thinBorder })
        })

      ws2.addRow([])
    })

    ws2.getColumn(1).width = 35
    ws2.getColumn(2).width = 22
    ws2.getColumn(3).width = 20
  }

  // Generate Buffer & Download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = `Laporan_SKM_SIKAP_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
  
  downloadFile(blob, filename)
}

export async function exportToPdf(
  summary: IndexSummary[],
  byService: IndexByService[],
  totalResponses: number,
  periodName?: string,
  demoSummary?: DemographicSummary[]
) {
  const element = React.createElement(SurveyReport, { summary, byService, totalResponses, periodName, demoSummary })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob()
  const filename = `Laporan_SKM_SIKAP_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`
  downloadFile(blob, filename)
}
