import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { IndexSummary, IndexByService } from '@/types'

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f9fafb',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  tableColLayanan: { width: '40%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableColSmall: { width: '15%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableColMedium: { width: '30%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
})

interface SurveyReportProps {
  summary: IndexSummary[]
  byService: IndexByService[]
  totalResponses: number
}

export function SurveyReport({ summary, byService, totalResponses }: SurveyReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Survei Kepuasan Masyarakat (SKM)</Text>
          <Text style={styles.subtitle}>Kementerian Agama Kabupaten Barito Utara</Text>
          <Text style={styles.subtitle}>Total Responden: {totalResponses}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Indeks</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Jenis Indeks</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Nilai Indeks</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Nilai Konversi</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Mutu / Kinerja</Text></View>
            </View>
            {summary.map((s, i) => (
              <View style={styles.tableRow} key={i}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{s.index_type}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{s.nilai_index}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{s.nilai_konversi}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{s.mutu} - {s.kinerja}</Text></View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Per Layanan</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColLayanan}><Text style={styles.tableCellHeader}>Layanan</Text></View>
              <View style={styles.tableColSmall}><Text style={styles.tableCellHeader}>Indeks</Text></View>
              <View style={styles.tableColMedium}><Text style={styles.tableCellHeader}>Nilai Konversi</Text></View>
              <View style={styles.tableColMedium}><Text style={styles.tableCellHeader}>Mutu</Text></View>
            </View>
            {byService.map((b, i) => (
              <View style={styles.tableRow} key={i}>
                <View style={styles.tableColLayanan}><Text style={styles.tableCell}>{b.service_name}</Text></View>
                <View style={styles.tableColSmall}><Text style={styles.tableCell}>{b.index_type}</Text></View>
                <View style={styles.tableColMedium}><Text style={styles.tableCell}>{b.nilai_konversi}</Text></View>
                <View style={styles.tableColMedium}><Text style={styles.tableCell}>{b.mutu}</Text></View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default SurveyReport
