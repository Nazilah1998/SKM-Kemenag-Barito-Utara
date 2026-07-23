import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { IndexSummary, IndexByService, DemographicSummary } from '@/types'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 35,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  badgePeriod: {
    backgroundColor: '#065f46',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    textAlign: 'center',
    marginBottom: 3,
  },
  badgePeriodText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badgeResponden: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  badgeRespondenText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#047857',
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    paddingLeft: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  
  // Table Styling
  table: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#065f46',
    alignItems: 'center',
    minHeight: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 18,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 18,
  },
  th: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    padding: 4,
  },
  td: {
    fontSize: 8,
    padding: 4,
    color: '#334155',
  },

  // Bar Chart Styling
  chartContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  chartRow: {
    marginBottom: 5,
  },
  chartLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  barTrack: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  barFillIpkp: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 3,
  },
  barFillIpak: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  barFillDemo: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  barValueText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingLeft: 4,
  },
  barValueTextDark: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#334155',
    marginLeft: 4,
  },

  // Demographics Grid Layout
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoCard: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  demoCardTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
  },
  demoItemRow: {
    marginBottom: 4,
  },
  demoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  demoItemLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  demoItemVal: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0284c7',
  },

  // Per Service Bar Items
  serviceItem: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  serviceBarGroup: {
    gap: 2,
  },
  barSubLabel: {
    width: 28,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#475569',
  },
  inlineBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  inlineTrack: {
    flex: 1,
    height: 9,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadgeText: {
    width: 60,
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#334155',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
})

interface SurveyReportProps {
  summary: IndexSummary[]
  byService: IndexByService[]
  totalResponses: number
  periodName?: string
  demoSummary?: DemographicSummary[]
}

export function SurveyReport({ summary, byService, totalResponses, periodName, demoSummary }: SurveyReportProps) {
  // Helper to aggregate demographic data for a field_key
  const getDemoFieldData = (key: string) => {
    if (!demoSummary || demoSummary.length === 0) return []
    const filtered = demoSummary.filter((d) => d.field_key.toLowerCase() === key.toLowerCase())
    const map = new Map<string, number>()
    let total = 0
    for (const item of filtered) {
      const val = item.demographic_value || 'Lainnya'
      const count = Number(item.count || 0)
      map.set(val, (map.get(val) || 0) + count)
      total += count
    }
    return Array.from(map.entries()).map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count)
  }

  const genderData = getDemoFieldData('jenis_kelamin')
  const ageData = getDemoFieldData('usia')
  const eduData = getDemoFieldData('pendidikan')
  const jobData = getDemoFieldData('pekerjaan')

  // Group services by unique service_name
  const serviceMap = new Map<string, { ipkp?: IndexByService; ipak?: IndexByService }>()
  byService.forEach((item) => {
    const existing = serviceMap.get(item.service_name) || {}
    if (item.index_type === 'IPKP') existing.ipkp = item
    if (item.index_type === 'IPAK') existing.ipak = item
    serviceMap.set(item.service_name, existing)
  })

  const uniqueServices = Array.from(serviceMap.entries())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>LAPORAN SURVEI KEPUASAN MASYARAKAT (SKM)</Text>
            <Text style={styles.subtitle}>Kementerian Agama Kabupaten Barito Utara</Text>
            <Text style={styles.subtext}>Sistem Informasi Analisis Rekapitulasi Ulasan Survei (SI-ARUS)</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.badgePeriod}>
              <Text style={styles.badgePeriodText}>PERIODE: {periodName ? periodName.toUpperCase() : 'TAHUN 2026'}</Text>
            </View>
            <View style={styles.badgeResponden}>
              <Text style={styles.badgeRespondenText}>Total Responden: {totalResponses} Orang</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Ringkasan Tabel & Chart Utama */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Ringkasan Indeks Kepuasan &amp; Anti Korupsi</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.th, { width: '25%' }]}>Jenis Indeks</Text>
              <Text style={[styles.th, { width: '25%', textAlign: 'center' }]}>Nilai Indeks (1-4)</Text>
              <Text style={[styles.th, { width: '25%', textAlign: 'center' }]}>Nilai Konversi (25-100)</Text>
              <Text style={[styles.th, { width: '25%', textAlign: 'center' }]}>Mutu / Kinerja</Text>
            </View>
            {summary.map((s, i) => (
              <View style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow} key={i}>
                <Text style={[styles.td, { width: '25%', fontWeight: 'bold' }]}>{s.index_type}</Text>
                <Text style={[styles.td, { width: '25%', textAlign: 'center' }]}>{Number(s.nilai_index).toFixed(4)}</Text>
                <Text style={[styles.td, { width: '25%', textAlign: 'center', fontWeight: 'bold', color: '#059669' }]}>
                  {Number(s.nilai_konversi).toFixed(2)}
                </Text>
                <Text style={[styles.td, { width: '25%', textAlign: 'center', fontWeight: 'bold' }]}>
                  {s.mutu} ({s.kinerja})
                </Text>
              </View>
            ))}
          </View>

          {/* Bar Chart Ringkasan Utama */}
          <View style={[styles.chartContainer, { marginTop: 6 }]}>
            <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>
              GRAFIK BATANG SKOR INDEKS KESELURUHAN
            </Text>
            {summary.map((s, idx) => {
              const val = Number(s.nilai_konversi) || 0
              const pct = Math.min(Math.max(val, 0), 100)
              const isTeal = s.index_type === 'IPKP'
              return (
                <View key={idx} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>
                    {s.index_type === 'IPKP' ? 'Indeks Persepsi Kualitas Pelayanan (IPKP)' : 'Indeks Persepsi Anti Korupsi (IPAK)'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        isTeal ? styles.barFillIpkp : styles.barFillIpak,
                        { width: `${pct}%` }
                      ]}
                    >
                      {pct > 15 && <Text style={styles.barValueText}>{val.toFixed(2)} / 100 ({s.mutu})</Text>}
                    </View>
                    {pct <= 15 && <Text style={styles.barValueTextDark}>{val.toFixed(2)} ({s.mutu})</Text>}
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Section 2: Grafik Demografi Responden */}
        {(genderData.length > 0 || ageData.length > 0 || eduData.length > 0 || jobData.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>2. Grafik Batang Demografi Responden</Text>
            </View>

            <View style={styles.demoGrid}>
              {/* Jenis Kelamin */}
              {genderData.length > 0 && (
                <View style={styles.demoCard}>
                  <Text style={styles.demoCardTitle}>Demografi Jenis Kelamin</Text>
                  {genderData.map((d, i) => (
                    <View key={i} style={styles.demoItemRow}>
                      <View style={styles.demoItemHeader}>
                        <Text style={styles.demoItemLabel}>{d.label}</Text>
                        <Text style={styles.demoItemVal}>{d.count} orang ({d.percentage.toFixed(1)}%)</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFillDemo, { width: `${Math.min(d.percentage, 100)}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Usia */}
              {ageData.length > 0 && (
                <View style={styles.demoCard}>
                  <Text style={styles.demoCardTitle}>Demografi Kelompok Usia</Text>
                  {ageData.map((d, i) => (
                    <View key={i} style={styles.demoItemRow}>
                      <View style={styles.demoItemHeader}>
                        <Text style={styles.demoItemLabel}>{d.label}</Text>
                        <Text style={styles.demoItemVal}>{d.count} orang ({d.percentage.toFixed(1)}%)</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFillDemo, { width: `${Math.min(d.percentage, 100)}%`, backgroundColor: '#0284c7' }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Pendidikan */}
              {eduData.length > 0 && (
                <View style={styles.demoCard}>
                  <Text style={styles.demoCardTitle}>Demografi Pendidikan Terakhir</Text>
                  {eduData.map((d, i) => (
                    <View key={i} style={styles.demoItemRow}>
                      <View style={styles.demoItemHeader}>
                        <Text style={styles.demoItemLabel}>{d.label}</Text>
                        <Text style={styles.demoItemVal}>{d.count} orang ({d.percentage.toFixed(1)}%)</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFillDemo, { width: `${Math.min(d.percentage, 100)}%`, backgroundColor: '#4f46e5' }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Pekerjaan */}
              {jobData.length > 0 && (
                <View style={styles.demoCard}>
                  <Text style={styles.demoCardTitle}>Demografi Pekerjaan</Text>
                  {jobData.map((d, i) => (
                    <View key={i} style={styles.demoItemRow}>
                      <View style={styles.demoItemHeader}>
                        <Text style={styles.demoItemLabel}>{d.label}</Text>
                        <Text style={styles.demoItemVal}>{d.count} orang ({d.percentage.toFixed(1)}%)</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFillDemo, { width: `${Math.min(d.percentage, 100)}%`, backgroundColor: '#0d9488' }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Section 3: Bar Chart Per Layanan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Grafik Batang Perbandingan Per Layanan (Bar Chart)</Text>
          </View>

          <View style={styles.chartContainer}>
            {uniqueServices.map(([serviceName, item], sIdx) => {
              const ipkpScore = item.ipkp ? Number(item.ipkp.nilai_konversi) : 0
              const ipakScore = item.ipak ? Number(item.ipak.nilai_konversi) : 0
              const ipkpPct = Math.min(Math.max(ipkpScore, 0), 100)
              const ipakPct = Math.min(Math.max(ipakScore, 0), 100)

              return (
                <View key={sIdx} style={styles.serviceItem} wrap={false}>
                  <Text style={styles.serviceTitle}>{sIdx + 1}. {serviceName}</Text>
                  <View style={styles.serviceBarGroup}>
                    {/* IPKP Row */}
                    <View style={styles.inlineBarRow}>
                      <Text style={styles.barSubLabel}>IPKP</Text>
                      <View style={styles.inlineTrack}>
                        <View style={[styles.barFillIpkp, { width: `${ipkpPct}%` }]}>
                          {ipkpPct > 20 && <Text style={styles.barValueText}>{ipkpScore.toFixed(2)}</Text>}
                        </View>
                        {ipkpPct <= 20 && <Text style={styles.barValueTextDark}>{ipkpScore.toFixed(2)}</Text>}
                      </View>
                      <Text style={styles.scoreBadgeText}>Mutu: {item.ipkp?.mutu || '-'}</Text>
                    </View>

                    {/* IPAK Row */}
                    <View style={styles.inlineBarRow}>
                      <Text style={styles.barSubLabel}>IPAK</Text>
                      <View style={styles.inlineTrack}>
                        <View style={[styles.barFillIpak, { width: `${ipakPct}%` }]}>
                          {ipakPct > 20 && <Text style={styles.barValueText}>{ipakScore.toFixed(2)}</Text>}
                        </View>
                        {ipakPct <= 20 && <Text style={styles.barValueTextDark}>{ipakScore.toFixed(2)}</Text>}
                      </View>
                      <Text style={styles.scoreBadgeText}>Mutu: {item.ipak?.mutu || '-'}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Section 4: Tabel Detail Per Layanan */}
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Tabel Rekapitulasi Rincian Per Layanan</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableRowHeader} wrap={false}>
              <Text style={[styles.th, { width: '45%' }]}>Nama Layanan</Text>
              <Text style={[styles.th, { width: '15%', textAlign: 'center' }]}>Indeks</Text>
              <Text style={[styles.th, { width: '20%', textAlign: 'center' }]}>Nilai Konversi</Text>
              <Text style={[styles.th, { width: '20%', textAlign: 'center' }]}>Mutu Pelayanan</Text>
            </View>
            {byService.map((b, i) => (
              <View style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow} key={i} wrap={false}>
                <Text style={[styles.td, { width: '45%' }]}>{b.service_name}</Text>
                <Text style={[styles.td, { width: '15%', textAlign: 'center', fontWeight: 'bold' }]}>{b.index_type}</Text>
                <Text style={[styles.td, { width: '20%', textAlign: 'center', fontWeight: 'bold', color: '#047857' }]}>
                  {Number(b.nilai_konversi).toFixed(2)}
                </Text>
                <Text style={[styles.td, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>
                  {b.mutu}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            SI-ARUS • Kantor Kementerian Agama Kabupaten Barito Utara
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export default SurveyReport
