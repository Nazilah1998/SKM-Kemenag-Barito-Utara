'use client'

import { motion } from 'framer-motion'
import { Laugh, Smile, Frown, Angry } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  customLabels?: Record<number, string>
  showAllLabels?: boolean
}

const defaultLabels: Record<number, string> = {
  4: 'Sangat Puas',
  3: 'Puas',
  2: 'Kurang Puas',
  1: 'Tidak Puas',
}

const emoteConfigs = [
  {
    score: 4,
    icon: Laugh,
    activeColor: 'text-teal-500 bg-teal-50 border-teal-300 shadow-md shadow-teal-500/20 ring-4 ring-teal-100 dark:ring-teal-950',
    inactiveColor: 'text-teal-400/60 bg-slate-50 border-slate-200 dark:border-gray-800 hover:text-teal-500 hover:bg-teal-50/50',
    labelColor: 'text-teal-600 dark:text-teal-400 font-extrabold',
  },
  {
    score: 3,
    icon: Smile,
    activeColor: 'text-cyan-500 bg-cyan-50 border-cyan-300 shadow-md shadow-cyan-500/20 ring-4 ring-cyan-100 dark:ring-cyan-950',
    inactiveColor: 'text-cyan-400/60 bg-slate-50 border-slate-200 dark:border-gray-800 hover:text-cyan-500 hover:bg-cyan-50/50',
    labelColor: 'text-cyan-600 dark:text-cyan-400 font-extrabold',
  },
  {
    score: 2,
    icon: Frown,
    activeColor: 'text-pink-500 bg-pink-50 border-pink-300 shadow-md shadow-pink-500/20 ring-4 ring-pink-100 dark:ring-pink-950',
    inactiveColor: 'text-pink-400/60 bg-slate-50 border-slate-200 dark:border-gray-800 hover:text-pink-500 hover:bg-pink-50/50',
    labelColor: 'text-pink-600 dark:text-pink-400 font-extrabold',
  },
  {
    score: 1,
    icon: Angry,
    activeColor: 'text-rose-600 bg-rose-50 border-rose-300 shadow-md shadow-rose-600/20 ring-4 ring-rose-100 dark:ring-rose-950',
    inactiveColor: 'text-rose-400/60 bg-slate-50 border-slate-200 dark:border-gray-800 hover:text-rose-500 hover:bg-rose-50/50',
    labelColor: 'text-rose-600 dark:text-rose-400 font-extrabold',
  },
]

export function StarRating({
  value,
  onChange,
  disabled = false,
  customLabels,
}: StarRatingProps) {
  const activeLabels = { ...defaultLabels, ...customLabels }

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg mx-auto">
        {emoteConfigs.map((cfg) => {
          const isSelected = value === cfg.score
          const Icon = cfg.icon
          const labelText = activeLabels[cfg.score] || defaultLabels[cfg.score]

          return (
            <motion.button
              key={cfg.score}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cfg.score)}
              whileHover={{ scale: disabled ? 1 : 1.08 }}
              whileTap={{ scale: disabled ? 1 : 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={cn(
                'flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
                isSelected ? cfg.activeColor : cfg.inactiveColor
              )}
            >
              <div className="flex items-center justify-center size-10 sm:size-12 mb-2">
                <Icon className={cn('size-8 sm:size-10 stroke-[2.2]', isSelected ? 'scale-110' : 'opacity-80')} />
              </div>
              <span className={cn('text-xs sm:text-sm text-center leading-tight transition-colors', isSelected ? cfg.labelColor : 'text-slate-600 dark:text-slate-400 font-semibold')}>
                {labelText}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
