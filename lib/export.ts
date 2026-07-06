import React from 'react'
import ExcelJS from 'exceljs'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { IndexSummary, IndexByService } from '@/types'
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
  totalResponses: number
) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SIKAP Kemenag'
  workbook.created = new Date()

  // Worksheet 1: Ringkasan
  const wsSummary = workbook.addWorksheet('Ringkasan Survei')
  
  wsSummary.columns = [
    { header: 'Indeks', key: 'index_type', width: 15 },
    { header: 'Nilai Indeks', key: 'nilai_index', width: 20 },
    { header: 'Nilai Konversi', key: 'nilai_konversi', width: 20 },
    { header: 'Mutu', key: 'mutu', width: 15 },
    { header: 'Kinerja', key: 'kinerja', width: 25 },
  ]

  wsSummary.addRow({ index_type: `Total Responden: ${totalResponses}`, nilai_index: '', nilai_konversi: '', mutu: '', kinerja: '' })
  wsSummary.addRow({})
  
  summary.forEach((s) => {
    wsSummary.addRow({
      index_type: s.index_type,
      nilai_index: s.nilai_index,
      nilai_konversi: s.nilai_konversi,
      mutu: s.mutu,
      kinerja: s.kinerja
    })
  })

  wsSummary.getRow(3).font = { bold: true }
  
  // Worksheet 2: Per Layanan
  const wsService = workbook.addWorksheet('Detail Per Layanan')
  wsService.columns = [
    { header: 'Layanan', key: 'service_name', width: 40 },
    { header: 'Indeks', key: 'index_type', width: 15 },
    { header: 'Nilai Konversi', key: 'nilai_konversi', width: 20 },
    { header: 'Mutu', key: 'mutu', width: 15 },
  ]

  byService.forEach((b) => {
    wsService.addRow({
      service_name: b.service_name,
      index_type: b.index_type,
      nilai_konversi: b.nilai_konversi,
      mutu: b.mutu,
    })
  })

  wsService.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = `Laporan_SKM_SIKAP_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
  
  downloadFile(blob, filename)
}

export async function exportToPdf(
  summary: IndexSummary[],
  byService: IndexByService[],
  totalResponses: number
) {
  const element = React.createElement(SurveyReport, { summary, byService, totalResponses })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob()
  const filename = `Laporan_SKM_SIKAP_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`
  downloadFile(blob, filename)
}
