'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Calendar, TrendingUp, Loader2, Activity, BarChart, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import type { SurveyPeriod } from '@/types'
import Link from 'next/link'

interface Stats {
  totalResponses: number
  activeServices: number
  activePeriod: SurveyPeriod | null
  ipkpScore: number | null
  ipakScore: number | null
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalResponses: 0,
    activeServices: 0,
    activePeriod: null,
    ipkpScore: null,
    ipakScore: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      try {
        const [resCount, servCount, periodRes] = await Promise.all([
          supabase.from('responses').select('*', { count: 'exact', head: true }),
          supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('survey_periods').select('*').eq('is_active', true).maybeSingle(),
        ])

        const periodId = periodRes.data?.id;

        // Fetch IPKP and IPAK scores (attempt to filter by period if exists)
        let ipkpReq = supabase.from('vw_index_summary').select('nilai_index').eq('index_type', 'IPKP')
        let ipakReq = supabase.from('vw_index_summary').select('nilai_index').eq('index_type', 'IPAK')
        
        if (periodId) {
          ipkpReq = ipkpReq.eq('period_id', periodId)
          ipakReq = ipakReq.eq('period_id', periodId)
        }

        const [ipkpRes, ipakRes] = await Promise.all([
          ipkpReq.maybeSingle().catch(() => ({ data: null })), // Fallback if period_id doesn't exist
          ipakReq.maybeSingle().catch(() => ({ data: null }))
        ])

        setStats({
          totalResponses: resCount.count ?? 0,
          activeServices: servCount.count ?? 0,
          activePeriod: (periodRes.data ?? null) as SurveyPeriod | null,
          ipkpScore: (ipkpRes.data as { nilai_index: number } | null)?.nilai_index ?? null,
          ipakScore: (ipakRes.data as { nilai_index: number } | null)?.nilai_index ?? null,
        })
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-emerald-600" />
          <span className="text-emerald-700 font-medium">Memuat Dashboard...</span>
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Respon',
      value: stats.totalResponses.toLocaleString(),
      icon: <Users className="size-7" />,
      color: 'from-blue-500 to-indigo-600',
      lightColor: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      href: '/admin/respon',
    },
    {
      title: 'Layanan Aktif',
      value: stats.activeServices,
      icon: <FileText className="size-7" />,
      color: 'from-emerald-500 to-teal-600',
      lightColor: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      href: '/admin/layanan',
    },
    {
      title: 'Periode Aktif',
      value: stats.activePeriod?.label ?? 'Tidak ada',
      subtitle: stats.activePeriod
        ? `${stats.activePeriod.start_date} - ${stats.activePeriod.end_date}`
        : undefined,
      icon: <Calendar className="size-7" />,
      color: 'from-purple-500 to-fuchsia-600',
      lightColor: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
      href: '/admin/periode',
    },
  ]

  const scoreCards = [
    {
      title: 'Skor IPKP',
      subtitle: 'Indeks Persepsi Kualitas Pelayanan',
      value: stats.ipkpScore != null ? stats.ipkpScore.toFixed(2) : 'N/A',
      icon: <Activity className="size-8 text-white" />,
      color: 'from-orange-400 to-orange-600 shadow-orange-500/30',
      href: '/admin/laporan',
    },
    {
      title: 'Skor IPAK',
      subtitle: 'Indeks Persepsi Anti Korupsi',
      value: stats.ipakScore != null ? stats.ipakScore.toFixed(2) : 'N/A',
      icon: <TrendingUp className="size-8 text-white" />,
      color: 'from-rose-400 to-rose-600 shadow-rose-500/30',
      href: '/admin/laporan',
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart className="size-8 text-emerald-600" />
            Dashboard SI-ARUS
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Sistem Informasi Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat
          </p>
        </div>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 grid-cols-1 md:grid-cols-3"
      >
        {cards.map((card) => (
          <motion.div key={card.title} variants={itemAnim}>
            <Link href={card.href} className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className={`p-4 rounded-2xl ${card.lightColor} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                      {card.icon}
                    </div>
                    <div className="hidden md:flex items-center justify-center size-8 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <ChevronRight className="size-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.title}</h3>
                    <div className="text-4xl font-black mt-2 text-gray-900 dark:text-white">
                      {card.value}
                    </div>
                    {card.subtitle && (
                      <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-2.5 py-1 rounded-md">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`h-1.5 w-full bg-gradient-to-r ${card.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 grid-cols-1 md:grid-cols-2"
      >
        {scoreCards.map((card) => (
          <motion.div key={card.title} variants={itemAnim}>
            <Link href={card.href} className="block group">
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 sm:p-8 text-white`}>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 size-48 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white/90">{card.title}</h3>
                    <p className="text-sm text-white/70 mt-1">{card.subtitle}</p>
                    <div className="text-5xl sm:text-6xl font-black mt-4 drop-shadow-md">
                      {card.value}
                    </div>
                  </div>
                  <div className="hidden sm:flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
