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
    activeColor: 'text-teal-600 bg-teal-50 border-teal-400 shadow-md shadow-teal-500/20 ring-4 ring-teal-100 dark:ring-teal-950 dark:bg-teal-950/80 dark:border-teal-600 dark:text-teal-300',
    inactiveColor: 'text-teal-500 bg-teal-50/50 border-teal-200 dark:border-teal-900/60 dark:bg-teal-950/30 hover:text-teal-600 hover:bg-teal-100/60 hover:border-teal-300',
    labelColor: 'text-teal-700 dark:text-teal-300 font-black',
  },
  {
    score: 3,
    icon: Smile,
    activeColor: 'text-cyan-600 bg-cyan-50 border-cyan-400 shadow-md shadow-cyan-500/20 ring-4 ring-cyan-100 dark:ring-cyan-950 dark:bg-cyan-950/80 dark:border-cyan-600 dark:text-cyan-300',
    inactiveColor: 'text-cyan-500 bg-cyan-50/50 border-cyan-200 dark:border-cyan-900/60 dark:bg-cyan-950/30 hover:text-cyan-600 hover:bg-cyan-100/60 hover:border-cyan-300',
    labelColor: 'text-cyan-700 dark:text-cyan-300 font-black',
  },
  {
    score: 2,
    icon: Frown,
    activeColor: 'text-pink-600 bg-pink-50 border-pink-400 shadow-md shadow-pink-500/20 ring-4 ring-pink-100 dark:ring-pink-950 dark:bg-pink-950/80 dark:border-pink-600 dark:text-pink-300',
    inactiveColor: 'text-pink-500 bg-pink-50/50 border-pink-200 dark:border-pink-900/60 dark:bg-pink-950/30 hover:text-pink-600 hover:bg-pink-100/60 hover:border-pink-300',
    labelColor: 'text-pink-700 dark:text-pink-300 font-black',
  },
  {
    score: 1,
    icon: Angry,
    activeColor: 'text-rose-600 bg-rose-50 border-rose-400 shadow-md shadow-rose-600/20 ring-4 ring-rose-100 dark:ring-rose-950 dark:bg-rose-950/80 dark:border-rose-600 dark:text-rose-300',
    inactiveColor: 'text-rose-500 bg-rose-50/50 border-rose-200 dark:border-rose-900/60 dark:bg-rose-950/30 hover:text-rose-600 hover:bg-rose-100/60 hover:border-rose-300',
    labelColor: 'text-rose-700 dark:text-rose-300 font-black',
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
    <div className="flex flex-col items-center justify-center w-full py-1 sm:py-3">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 w-full max-w-xl mx-auto">
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
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={cn(
                'flex flex-col items-center justify-between p-2 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-[95px] sm:min-h-[120px] w-full',
                isSelected ? cfg.activeColor : cfg.inactiveColor
              )}
            >
              <div className="flex items-center justify-center size-8 sm:size-12 mt-1 mb-1 shrink-0">
                <Icon className={cn('size-7 sm:size-10 stroke-[2.2]', isSelected ? 'scale-110 drop-shadow-sm' : '')} />
              </div>
              <span className={cn('text-[10px] xs:text-[11px] sm:text-xs md:text-sm text-center leading-tight transition-colors break-words max-w-full font-extrabold pb-0.5', isSelected ? cfg.labelColor : 'text-slate-950 dark:text-slate-100')}>
                {labelText}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
