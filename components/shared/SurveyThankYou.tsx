'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/shared/I18nProvider'
import Link from 'next/link'
import { CheckCircle2, Home, RotateCcw, Sparkles, HeartHandshake } from 'lucide-react'
import { motion } from 'framer-motion'

export function SurveyThankYou() {
  const { t } = useI18n()

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/60 dark:bg-gray-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-emerald-600/10 border border-slate-200/80 dark:border-gray-800 overflow-hidden relative"
      >
        {/* Decorative Top Gradient Banner */}
        <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <Sparkles className="absolute top-4 right-6 size-12 text-white/20 animate-pulse" />
        </div>
        
        <div className="px-6 pb-8 pt-0 sm:px-10 sm:pb-10 text-center relative z-10 flex flex-col items-center -mt-14">
          {/* Animated Success Badge */}
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="mb-5 flex size-24 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 ring-8 ring-white dark:ring-gray-900"
          >
            <CheckCircle2 className="size-12 stroke-[2.5]" />
          </motion.div>
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-3">
            <HeartHandshake className="size-3.5 text-emerald-600" />
            Survei Berhasil Terkirim
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {t('survey.thank_you')}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto mb-6">
            {t('survey.thank_you_desc')}
          </p>

          <div className="w-full bg-slate-50 dark:bg-gray-800/60 border border-slate-200/80 dark:border-gray-700 rounded-2xl p-4 mb-6 text-left space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pesan Apresiasi</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-normal">
              Masukan dan jawaban Anda sangat berharga bagi peningkatan kualitas pelayanan publik pada <strong>Kantor Kementerian Agama Kabupaten Barito Utara</strong>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link href="/" className="w-full sm:flex-1">
              <Button 
                size="lg" 
                className="w-full rounded-2xl py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer gap-2"
              >
                <Home className="size-4" />
                <span>Kembali ke Beranda</span>
              </Button>
            </Link>

            <Button 
              type="button"
              variant="outline"
              size="lg" 
              onClick={() => window.location.reload()}
              className="w-full sm:flex-1 rounded-2xl py-6 border-slate-200 dark:border-gray-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer gap-2"
            >
              <RotateCcw className="size-4 text-emerald-600" />
              <span>Isi Survei Lagi</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
