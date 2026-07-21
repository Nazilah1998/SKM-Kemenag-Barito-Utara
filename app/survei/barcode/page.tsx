'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode, Copy, Check, Printer, Sparkles, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { Footer } from '@/components/shared/Footer'
import PageBanner from '@/components/shared/PageBanner'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types'
import { toast } from 'sonner'
import Image from 'next/image'

export default function BarcodePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all')
  const [centerLogo, setCenterLogo] = useState<string>('/arus.png')
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  const selectedSlug = selectedServiceId !== 'all' ? services.find(s => s.id === selectedServiceId)?.slug : null
  const targetUrl = selectedSlug ? `${origin}/survei?service=${selectedSlug}` : `${origin}/survei`

  useEffect(() => {
    async function fetchServices() {
      const supabase = createClient()
      const { data } = await supabase.from('services').select('*').eq('is_active', true).order('name')
      if (data) setServices(data as Service[])
    }
    fetchServices()
  }, [])

  const generateQRCode = useCallback(() => {
    if (!canvasRef.current || !targetUrl) return
    const canvas = canvasRef.current

    QRCode.toCanvas(
      canvas,
      targetUrl,
      {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          console.error('QR Code Generation Error:', error)
          return
        }

        if (centerLogo && centerLogo !== 'none') {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          img.src = centerLogo
          img.onload = () => {
            const logoSize = canvas.width * 0.24
            const x = (canvas.width - logoSize) / 2
            const y = (canvas.height - logoSize) / 2

            // Draw white rounded background container behind logo
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
            ctx.shadowBlur = 8
            ctx.beginPath()
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(x - 6, y - 6, logoSize + 12, logoSize + 12, 16)
            } else {
              ctx.rect(x - 6, y - 6, logoSize + 12, logoSize + 12)
            }
            ctx.fill()
            ctx.shadowBlur = 0 // reset shadow

            // Draw Logo Image
            ctx.drawImage(img, x, y, logoSize, logoSize)
          }
        }
      }
    )
  }, [targetUrl, centerLogo])

  useEffect(() => {
    generateQRCode()
  }, [generateQRCode])

  function handleDownload() {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const image = canvas.toDataURL('image/png')

    const selectedName = selectedServiceId === 'all' 
      ? 'Umum' 
      : services.find(s => s.id === selectedServiceId)?.name || 'Layanan'

    const link = document.createElement('a')
    link.href = image
    link.download = `QR-Code-Survei-SI-ARUS-${selectedName.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    link.click()
    toast.success('QR Code berhasil diunduh!')
  }

  function handleCopyLink() {
    if (!targetUrl) return
    navigator.clipboard.writeText(targetUrl)
    setCopied(true)
    toast.success('Tautan survei disalin ke clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-slate-50/70 dark:bg-gray-950 pb-16 print:bg-white print:pb-0">
        <div className="print:hidden">
          <PageBanner
            title="QR Code &amp; Barcode Survei"
            description="Buat, kustomisasi, dan unduh QR Code resmi SI-ARUS berlogo untuk ditempelkan di ruang pelayanan publik Kantor Kementerian Agama Kabupaten Barito Utara."
            eyebrow="Fasilitas Media Cetak &amp; Display"
            breadcrumb={[
              { label: 'Beranda', href: '/' },
              { label: 'Isi Survei', href: '/survei' },
              { label: 'QR Code & Barcode' },
            ]}
          />
        </div>

        <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-20 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Control Panel Settings */}
            <div className="lg:col-span-6 space-y-6 print:hidden">
              <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-6">
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="size-5 text-emerald-600" />
                    <span>Konfigurasi QR Code</span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Pilihan Target Layanan */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 className="size-4 text-emerald-600" />
                      <span>Target Layanan Publik</span>
                    </Label>
                    <Select value={selectedServiceId} onValueChange={(v) => v !== null && setSelectedServiceId(v)}>
                      <SelectTrigger className="w-full rounded-2xl border-slate-200 dark:border-gray-800 py-6 text-xs sm:text-sm font-semibold shadow-xs">
                        <SelectValue placeholder="Pilih Layanan Target" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl p-1.5 shadow-xl max-h-72">
                        <SelectItem value="all" className="rounded-xl py-2 font-bold">
                          🌐 Semua Layanan (Kuesioner Umum)
                        </SelectItem>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="rounded-xl py-2 text-xs sm:text-sm font-semibold">
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pilihan Logo di Tengah QR */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="size-4 text-emerald-600" />
                      <span>Logo Pusat QR Code</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: '/arus.png', label: 'SI-ARUS', img: '/arus.png' },
                        { id: '/kemenag.svg', label: 'Kemenag', img: '/kemenag.svg' },
                        { id: '/hapakat.png', label: 'HAPAKAT', img: '/hapakat.png' },
                        { id: 'none', label: 'Polos', img: null },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCenterLogo(item.id)}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                            centerLogo === item.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50/50 dark:bg-gray-800/40 border-slate-200/80 dark:border-gray-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.img ? (
                            <Image src={item.img} alt={item.label} width={32} height={32} className="object-contain size-8" />
                          ) : (
                            <div className="size-8 flex items-center justify-center font-bold text-xs text-slate-400">∅</div>
                          )}
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Target URL */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Tautan Target QR Code</Label>
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700">
                      <input
                        type="text"
                        readOnly
                        value={targetUrl}
                        className="flex-1 bg-transparent text-xs font-mono font-bold text-slate-700 dark:text-slate-300 outline-none truncate"
                      />
                      <Button type="button" size="sm" onClick={handleCopyLink} variant="ghost" className="rounded-xl h-8 text-xs font-bold gap-1 cursor-pointer">
                        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Poster & QR Code Display */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="border border-slate-200/80 dark:border-gray-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden text-center print:shadow-none print:border-none">
                <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 sm:p-8 space-y-2 relative overflow-hidden">
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <Image src="/kemenag.svg" alt="Logo Kemenag" width={40} height={40} className="object-contain" />
                    <div className="h-8 w-px bg-white/20" />
                    <Image src="/arus.png" alt="Logo SI-ARUS" width={40} height={40} className="object-contain" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                    SURVEI KEPUASAN MASYARAKAT
                  </h3>
                  <p className="text-xs font-bold text-emerald-200">
                    KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA
                  </p>
                </div>

                <CardContent className="p-6 sm:p-10 flex flex-col items-center justify-center space-y-6">
                  {/* Display Service Badge */}
                  <div className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                    {selectedServiceId === 'all' ? 'Layanan Umum Publik' : services.find(s => s.id === selectedServiceId)?.name}
                  </div>

                  {/* QR Canvas */}
                  <div className="p-4 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10 inline-block">
                    <canvas ref={canvasRef} className="rounded-2xl max-w-full h-auto" />
                  </div>

                  <div className="space-y-1 max-w-sm text-center">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                      Pindai (Scan) QR Code di atas dengan Kamera HP Anda
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Bantu kami meningkatkan mutu pelayanan dengan memberikan ulasan &amp; masukan objektif.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-gray-800 w-full flex items-center justify-center gap-2">
                    <Image src="/hapakat.png" alt="HAPAKAT" width={100} height={32} className="object-contain opacity-80" />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full pt-4 print:hidden">
                    <Button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 rounded-2xl py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer gap-2"
                    >
                      <Download className="size-5" />
                      <span>Unduh Gambar QR</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrint}
                      className="rounded-2xl py-6 border-slate-200 dark:border-gray-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer gap-2"
                    >
                      <Printer className="size-5 text-emerald-600" />
                      <span>Cetak Poster</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  )
}
