'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/shared/I18nProvider'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export function SurveyThankYou() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 overflow-hidden relative"
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none"></div>
        
        <div className="p-8 md:p-12 text-center relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-100 border-4 border-emerald-50 shadow-sm"
          >
            <CheckCircle2 className="size-12 text-emerald-600" />
          </motion.div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            {t('survey.thank_you')}
          </h2>
          
          <p className="text-gray-600 text-base md:text-lg mb-8 leading-relaxed max-w-sm mx-auto">
            {t('survey.thank_you_desc')}
          </p>
          
          <div className="w-full h-px bg-gray-100 mb-8"></div>
          
          <Link href="/" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 group"
            >
              <ArrowLeft className="mr-2 size-5 transition-transform group-hover:-translate-x-1" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
