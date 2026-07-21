'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Save, Loader2, Settings, Building, ShieldCheck, FileSpreadsheet, Globe, Lock, MessageSquare, Image as ImageIcon, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { AppSetting } from '@/types'

const settingsSchema = z.object({
  site_name: z.string().min(1, 'Nama situs (ID) wajib diisi'),
  site_name_en: z.string().min(1, 'Nama situs (EN) wajib diisi'),
  instansi_name: z.string().min(1, 'Nama instansi wajib diisi'),
  instansi_address: z.string().optional(),
  logo_url: z.string().optional(),
  survey_welcome_message: z.string().optional(),
  survey_welcome_message_en: z.string().optional(),
  allow_anonymous: z.boolean(),
  require_contact: z.boolean(),
  turnstile_enabled: z.boolean(),
  turnstile_site_key: z.string().optional(),
  turnstile_secret_key: z.string().optional(),
})

type SettingsForm = z.infer<typeof settingsSchema>

const SETTING_KEYS = [
  'site_name',
  'site_name_en',
  'instansi_name',
  'instansi_address',
  'logo_url',
  'survey_welcome_message',
  'survey_welcome_message_en',
  'allow_anonymous',
  'require_contact',
  'turnstile_enabled',
  'turnstile_site_key',
  'turnstile_secret_key',
] as const

export default function AdminPengaturanPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_name: 'SI-ARUS - Survei Kepuasan Masyarakat',
      site_name_en: 'SI-ARUS - Public Satisfaction Survey',
      instansi_name: 'Kementerian Agama Kabupaten Barito Utara',
      instansi_address: 'Jl. Ahmad Yani No. 1, Muara Teweh, Kalimantan Tengah',
      logo_url: '',
      survey_welcome_message: 'Selamat datang di Aplikasi Survei Kepuasan Masyarakat (SIKAP) Kantor Kementerian Agama Kabupaten Barito Utara.',
      survey_welcome_message_en: 'Welcome to Public Satisfaction Survey Application (SIKAP) Office of Ministry of Religious Affairs North Barito Regency.',
      allow_anonymous: true,
      require_contact: false,
      turnstile_enabled: false,
      turnstile_site_key: '',
      turnstile_secret_key: '',
    },
  })

  useEffect(() => {
    let ignore = false
    async function fetchSettings() {
      const { data } = await supabase.from('app_settings').select('*')
      if (!ignore && data) {
        const settings = data as AppSetting[]
        const getValue = (k: string, def: string) => settings.find((s) => s.key === k)?.value ?? def
        const getBool = (k: string, def: boolean) => {
          const val = settings.find((s) => s.key === k)?.value
          return val !== undefined ? val === 'true' : def
        }

        reset({
          site_name: getValue('site_name', 'SIKAP - Survei Kepuasan Masyarakat'),
          site_name_en: getValue('site_name_en', 'SIKAP - Public Satisfaction Survey'),
          instansi_name: getValue('instansi_name', 'Kementerian Agama Kabupaten Barito Utara'),
          instansi_address: getValue('instansi_address', 'Jl. Ahmad Yani No. 1, Muara Teweh, Kalimantan Tengah'),
          logo_url: getValue('logo_url', ''),
          survey_welcome_message: getValue('survey_welcome_message', 'Selamat datang di Aplikasi Survei Kepuasan Masyarakat (SIKAP) Kantor Kementerian Agama Kabupaten Barito Utara.'),
          survey_welcome_message_en: getValue('survey_welcome_message_en', 'Welcome to Public Satisfaction Survey Application (SIKAP) Office of Ministry of Religious Affairs North Barito Regency.'),
          allow_anonymous: getBool('allow_anonymous', true),
          require_contact: getBool('require_contact', false),
          turnstile_enabled: getBool('turnstile_enabled', false),
          turnstile_site_key: getValue('turnstile_site_key', ''),
          turnstile_secret_key: getValue('turnstile_secret_key', ''),
        })
        setLoading(false)
      }
    }
    fetchSettings()
    return () => { ignore = true }
  }, [reset, supabase])

  async function onSubmit(data: SettingsForm) {
    setSaving(true)

    const upserts = SETTING_KEYS.map((key) => {
      let valStr = ''
      const rawVal = data[key as keyof SettingsForm]
      if (typeof rawVal === 'boolean') {
        valStr = rawVal ? 'true' : 'false'
      } else {
        valStr = (rawVal as string) || ''
      }

      return {
        key,
        value: valStr,
        updated_at: new Date().toISOString(),
      }
    })

    const { error } = await supabase.from('app_settings').upsert(upserts, { onConflict: 'key' })

    if (error) {
      toast.error('Gagal menyimpan pengaturan: ' + error.message)
      setSaving(false)
      return
    }

    toast.success('Pengaturan sistem berhasil disimpan')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Header Banner Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Pengaturan Sistem &amp; Aplikasi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Konfigurasi identitas instansi, batas pengisian survei, dan keamanan anti-bot.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="identitas" className="w-full space-y-6">
          <TabsList className="bg-slate-100 dark:bg-gray-800 p-1.5 rounded-2xl inline-flex flex-wrap gap-1">
            <TabsTrigger value="identitas" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2">
              <Building className="size-3.5" />
              <span>Identitas &amp; Situs</span>
            </TabsTrigger>

            <TabsTrigger value="formulir" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2">
              <FileSpreadsheet className="size-3.5" />
              <span>Aturan Survei</span>
            </TabsTrigger>

            <TabsTrigger value="keamanan" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2">
              <ShieldCheck className="size-3.5" />
              <span>Keamanan &amp; Anti-Bot</span>
            </TabsTrigger>

            <Link href="/admin/barcode" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer ml-auto">
              <QrCode className="size-3.5" />
              <span>Generator QR Code Barcode</span>
            </Link>
          </TabsList>

          {/* TAB 1: IDENTITAS & SITUS */}
          <TabsContent value="identitas">
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="size-4 text-emerald-600" />
                  Identitas Situs &amp; Instansi
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Pengaturan umum nama aplikasi dan profil instansi Kementerian Agama.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="site_name" className="text-xs font-bold text-slate-700">Nama Situs / Aplikasi (Indonesia)</Label>
                    <Input id="site_name" placeholder="SIKAP - Survei Kepuasan Masyarakat" {...register('site_name')} className="rounded-xl border-slate-200 text-xs sm:text-sm font-semibold" />
                    {errors.site_name && <p className="text-xs text-rose-500">{errors.site_name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="site_name_en" className="text-xs font-bold text-slate-700">Nama Situs / Aplikasi (English)</Label>
                    <Input id="site_name_en" placeholder="SIKAP - Public Satisfaction Survey" {...register('site_name_en')} className="rounded-xl border-slate-200 text-xs sm:text-sm font-semibold" />
                    {errors.site_name_en && <p className="text-xs text-rose-500">{errors.site_name_en.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instansi_name" className="text-xs font-bold text-slate-700">Nama Instansi / Satuan Kerja</Label>
                  <Input id="instansi_name" placeholder="Kementerian Agama Kabupaten Barito Utara" {...register('instansi_name')} className="rounded-xl border-slate-200 text-xs sm:text-sm font-semibold" />
                  {errors.instansi_name && <p className="text-xs text-rose-500">{errors.instansi_name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instansi_address" className="text-xs font-bold text-slate-700">Alamat Lengkap Instansi</Label>
                  <Input id="instansi_address" placeholder="Jl. Ahmad Yani No. 1, Muara Teweh, Kalimantan Tengah" {...register('instansi_address')} className="rounded-xl border-slate-200 text-xs sm:text-sm" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logo_url" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-slate-400" />
                    <span>URL Logo Instansi (Opsional)</span>
                  </Label>
                  <Input id="logo_url" placeholder="https://domain.com/logo-kemenag.png" {...register('logo_url')} className="rounded-xl border-slate-200 text-xs" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: REGULASI SURVEI */}
          <TabsContent value="formulir">
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="size-4 text-emerald-600" />
                  Pengaturan Formulir &amp; Pesan Sambutan
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Atur teks pengantar dan kebijakan isian identitas responden.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="survey_welcome_message" className="text-xs font-bold text-slate-700">Pesan Pengantar Survei (Indonesia)</Label>
                  <Textarea id="survey_welcome_message" rows={3} placeholder="Selamat datang di survei..." {...register('survey_welcome_message')} className="rounded-2xl border-slate-200 text-xs sm:text-sm leading-relaxed" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="survey_welcome_message_en" className="text-xs font-bold text-slate-700">Pesan Pengantar Survei (English)</Label>
                  <Textarea id="survey_welcome_message_en" rows={3} placeholder="Welcome to survey..." {...register('survey_welcome_message_en')} className="rounded-2xl border-slate-200 text-xs sm:text-sm leading-relaxed" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900">Izinkan Responden Anonim</Label>
                      <p className="text-[11px] text-slate-500">Masyarakat dapat mengisi tanpa mencantumkan nama/kontak</p>
                    </div>
                    <Controller
                      name="allow_anonymous"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900">Wajibkan Nomor Kontak/HP</Label>
                      <p className="text-[11px] text-slate-500">Masyarakat wajib memasukkan nomor Telepon/WA</p>
                    </div>
                    <Controller
                      name="require_contact"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: KEAMANAN & ANTI-BOT */}
          <TabsContent value="keamanan">
            <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="size-4 text-emerald-600" />
                  Keamanan &amp; Cloudflare Turnstile Anti-Bot
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Aktifkan verifikasi Turnstile captcha otomatis untuk mencegah spammer dan bot.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-emerald-950">Aktifkan Cloudflare Turnstile</Label>
                    <p className="text-[11px] text-emerald-800">Melindungi formulir survei publik dengan verifikasi CAPTCHA otomatis</p>
                  </div>
                  <Controller
                    name="turnstile_enabled"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="turnstile_site_key" className="text-xs font-bold text-slate-700">Turnstile Site Key</Label>
                    <Input id="turnstile_site_key" placeholder="0x4AAAAAA..." {...register('turnstile_site_key')} className="rounded-xl border-slate-200 font-mono text-xs" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="turnstile_secret_key" className="text-xs font-bold text-slate-700">Turnstile Secret Key</Label>
                    <Input id="turnstile_secret_key" type="password" placeholder="••••••••••••••••" {...register('turnstile_secret_key')} className="rounded-xl border-slate-200 font-mono text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button Floating/Bottom Bar */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={saving} 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-6 py-6 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>Simpan Semua Pengaturan</span>
          </Button>
        </div>
      </form>

    </div>
  )
}
