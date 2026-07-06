'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Calendar, TrendingUp, Loader2, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import type { SurveyPeriod } from '@/types'

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

      const [resCount, servCount, periodRes, ipkpRes, ipakRes] = await Promise.all([
        supabase.from('responses').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('survey_periods').select('*').eq('is_active', true).maybeSingle(),
        supabase.from('vw_index_summary').select('nilai_index').eq('index_type', 'IPKP').maybeSingle(),
        supabase.from('vw_index_summary').select('nilai_index').eq('index_type', 'IPAK').maybeSingle(),
      ])

      setStats({
        totalResponses: resCount.count ?? 0,
        activeServices: servCount.count ?? 0,
        activePeriod: (periodRes.data ?? null) as SurveyPeriod | null,
        ipkpScore: (ipkpRes.data as { nilai_index: number } | null)?.nilai_index ?? null,
        ipakScore: (ipakRes.data as { nilai_index: number } | null)?.nilai_index ?? null,
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Respon',
      value: stats.totalResponses.toLocaleString(),
      icon: <Users className="size-6" />,
      color: 'from-blue-500 to-indigo-600',
      lightColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
    },
    {
      title: 'Layanan Aktif',
      value: stats.activeServices,
      icon: <FileText className="size-6" />,
      color: 'from-emerald-500 to-teal-600',
      lightColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
    },
    {
      title: 'Periode Aktif',
      value: stats.activePeriod?.label ?? 'Tidak ada',
      subtitle: stats.activePeriod
        ? `${stats.activePeriod.start_date} - ${stats.activePeriod.end_date}`
        : undefined,
      icon: <Calendar className="size-6" />,
      color: 'from-purple-500 to-fuchsia-600',
      lightColor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
    },
    {
      title: 'Skor IPKP',
      value: stats.ipkpScore != null ? stats.ipkpScore.toFixed(2) : 'N/A',
      icon: <Activity className="size-6" />,
      color: 'from-orange-500 to-amber-600',
      lightColor: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
    },
    {
      title: 'Skor IPAK',
      value: stats.ipakScore != null ? stats.ipakScore.toFixed(2) : 'N/A',
      icon: <TrendingUp className="size-6" />,
      color: 'from-rose-500 to-pink-600',
      lightColor: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Ringkasan performa sistem kepuasan masyarakat.</p>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {cards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Card className="overflow-hidden border-0 shadow-lg shadow-gray-200/40 dark:shadow-black/20 group hover:shadow-xl transition-shadow duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${card.lightColor} group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</h3>
                    <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                      {card.value}
                    </div>
                    {card.subtitle && (
                      <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500 line-clamp-1">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {/* Decorative bottom gradient line */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${card.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
