'use client'

import { useEffect, useState, useRef } from 'react'
import { Download, ArrowLeft, Scan } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/components/shared/I18nProvider'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { Footer } from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types'
import Link from 'next/link'

export default function BarcodePage() {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchServices() {
      const supabase = createClient()
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (data) setServices(data as Service[])
      setLoading(false)
    }
    fetchServices()
  }, [])

  useEffect(() => {
    async function generateQR() {
      const QRCode = (await import('qrcode')).default
      let url = `${window.location.origin}/survei`
      if (selectedService) {
        url += `?service=${selectedService}`
      }
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: { dark: '#059669', light: '#ffffff' },
        })
        setQrDataUrl(dataUrl)
      } catch {
        // fallback
      }
    }
    generateQR()
  }, [selectedService])

  function handleDownload() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `sikap-qr${selectedService ? '-' + selectedService : ''}.png`
    link.href = qrDataUrl
    link.click()
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t('common.back')}
          </Link>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100">
                <Scan className="size-6 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">QR Code Survei</CardTitle>
              <CardDescription>
                Scan QR code untuk mengakses survei kepuasan masyarakat
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="flex w-full max-w-xs">
                <Select value={selectedService} onValueChange={(v) => v && setSelectedService(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Semua Layanan --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Layanan</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {qrDataUrl ? (
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code" className="size-64" />
                </div>
              ) : (
                <div className="flex size-64 items-center justify-center rounded-xl border bg-gray-50">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Generating QR...</p>
                  )}
                </div>
              )}

              <Button onClick={handleDownload} disabled={!qrDataUrl}>
                <Download className="mr-2 size-4" />
                Download PNG
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
