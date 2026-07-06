'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Turnstile } from '@marsidev/react-turnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_EMAIL } from '@/lib/constants'
import { toast } from 'sonner'
import { verifyTurnstileToken } from './actions'

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    if (turnstileSiteKey && !turnstileToken) {
      toast.error('Silakan selesaikan verifikasi keamanan')
      return
    }

    setLoading(true)

    if (turnstileSiteKey) {
      const isHuman = await verifyTurnstileToken(turnstileToken)
      if (!isHuman) {
        toast.error('Verifikasi keamanan gagal, coba lagi.')
        setLoading(false)
        return
      }
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error('Email atau kata sandi salah')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Gagal memuat sesi pengguna')
      setLoading(false)
      return
    }

    // Verifikasi ketersediaan pengguna di database pusdatin terpusat
    const { data: pusdatinUser, error: pusdatinError } = await supabase
      .rpc('get_pusdatin_user', { email_address: data.email })

    // Hanya lakukan pengecekan ketat jika bukan super admin
    if (user.email !== ADMIN_EMAIL) {
      if (pusdatinError || !pusdatinUser) {
        await supabase.auth.signOut()
        toast.error('Akun Anda tidak terdaftar di sistem terpusat.')
        setLoading(false)
        return
      }

      if (pusdatinUser.status !== 'active') {
        await supabase.auth.signOut()
        toast.error('Akun Anda sedang dinonaktifkan oleh Administrator.')
        setLoading(false)
        return
      }

      // Verifikasi akses spesifik untuk SIKAP / Survey
      const hasSurveyAccess = pusdatinUser.app_permissions?.some(
        (p: { app_id: string; role: string }) => p.app_id === 'survey-kemenag' && p.role !== 'none'
      );

      if (!hasSurveyAccess) {
        await supabase.auth.signOut()
        toast.error('Anda tidak memiliki hak akses untuk aplikasi SIKAP.')
        setLoading(false)
        return
      }
    }

    router.replace('/admin')
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Kiri: Bagian Branding (Hanya tampil di Desktop) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-emerald-700 p-12 lg:flex">
        {/* Dekorasi Background */}
        <div className="absolute -left-20 -top-20 size-[500px] rounded-full bg-emerald-600/50 blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 size-[400px] rounded-full bg-teal-500/30 blur-[60px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center text-center text-white"
        >
          <div className="mb-8 flex size-32 items-center justify-center rounded-full bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <ShieldCheck className="size-20 text-emerald-100" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">SIKAP</h1>
          <p className="max-w-md text-lg text-emerald-50/90 leading-relaxed">
            Sistem Informasi Kepuasan Masyarakat Terpadu Kementerian Agama Kabupaten Barito Utara
          </p>
        </motion.div>
      </div>

      {/* Kanan: Bagian Formulir Login */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Selamat Datang</h2>
            <p className="mt-2 text-sm text-gray-500">Silakan masuk ke akun Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Alamat Email</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="size-5 text-gray-400" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@kemenag.go.id" 
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 py-6 pl-10 pr-3 text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                    {...register('email')} 
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Kata Sandi</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="size-5 text-gray-400" />
                  </div>
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 py-6 pl-10 pr-10 text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                    {...register('password')} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            {turnstileSiteKey && (
              <div className="flex justify-center pt-2">
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <LogIn className="size-5 mr-2" />}
              Masuk ke Dasbor
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SIKAP Kemenag Barito Utara
          </div>
        </motion.div>
      </div>
    </div>
  )
}
