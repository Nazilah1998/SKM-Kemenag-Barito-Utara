'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { AppSetting } from '@/types'

const settingsSchema = z.object({
  site_name: z.string().min(1, 'Nama situs wajib diisi'),
  site_name_en: z.string().min(1, 'Site name (EN) wajib diisi'),
  logo_url: z.string().optional(),
  turnstile_site_key: z.string().optional(),
  turnstile_secret_key: z.string().optional(),
})

type SettingsForm = z.infer<typeof settingsSchema>

const SETTING_KEYS = ['site_name', 'site_name_en', 'logo_url', 'turnstile_site_key', 'turnstile_secret_key'] as const

export default function AdminPengaturanPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_name: '', site_name_en: '', logo_url: '',
      turnstile_site_key: '', turnstile_secret_key: '',
    },
  })

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('app_settings').select('*')
      if (data) {
        const settings = data as AppSetting[]
        const defaults: SettingsForm = {
          site_name: settings.find((s) => s.key === 'site_name')?.value || '',
          site_name_en: settings.find((s) => s.key === 'site_name_en')?.value || '',
          logo_url: settings.find((s) => s.key === 'logo_url')?.value || '',
          turnstile_site_key: settings.find((s) => s.key === 'turnstile_site_key')?.value || '',
          turnstile_secret_key: settings.find((s) => s.key === 'turnstile_secret_key')?.value || '',
        }
        reset(defaults)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [reset, supabase])

  async function onSubmit(data: SettingsForm) {
    setSaving(true)

    const upserts = SETTING_KEYS.map((key) => ({
      key,
      value: data[key as keyof SettingsForm] || '',
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('app_settings').upsert(upserts, { onConflict: 'key' })

    if (error) {
      toast.error('Gagal menyimpan pengaturan')
      setSaving(false)
      return
    }

    toast.success('Pengaturan berhasil disimpan')
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="size-6 text-emerald-600" />
            Pengaturan Sistem
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Konfigurasi dasar aplikasi SI-ARUS.</p>
        </div>
      </div>

      <Card className="max-w-2xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/40 dark:shadow-black/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg">Pengaturan Situs</CardTitle>
          <CardDescription>Kelola pengaturan umum aplikasi SI-ARUS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="site_name">Nama Situs (Indonesia)</Label>
              <Input id="site_name" placeholder="SI-ARUS - Kemenag Barito Utara" {...register('site_name')} />
              {errors.site_name && <p className="text-xs text-destructive">{errors.site_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_name_en">Nama Situs (English)</Label>
              <Input id="site_name_en" placeholder="SI-ARUS - Ministry of Religious Affairs" {...register('site_name_en')} />
              {errors.site_name_en && <p className="text-xs text-destructive">{errors.site_name_en.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL Logo</Label>
              <Input id="logo_url" placeholder="https://example.com/logo.png" {...register('logo_url')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turnstile_site_key">Turnstile Site Key</Label>
              <Input id="turnstile_site_key" placeholder="0x4AAAA..." {...register('turnstile_site_key')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turnstile_secret_key">Turnstile Secret Key</Label>
              <Input id="turnstile_secret_key" type="password" placeholder="••••••••" {...register('turnstile_secret_key')} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-500/20" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Simpan Pengaturan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
