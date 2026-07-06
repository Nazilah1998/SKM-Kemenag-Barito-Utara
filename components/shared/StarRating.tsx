'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: number
}

const labels: Record<number, string> = {
  1: 'Tidak Baik',
  2: 'Kurang Baik',
  3: 'Baik',
  4: 'Sangat Baik'
}

export function StarRating({ value, onChange, disabled = false, size = 32 }: StarRatingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-2">
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map((star) => (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            whileHover={{ scale: disabled ? 1 : 1.2 }}
            whileTap={{ scale: disabled ? 1 : 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={cn(
              'cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors',
                value >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              )}
            />
          </motion.button>
        ))}
      </div>
      <div className="h-6 flex items-center justify-center">
        {value > 0 ? (
          <span className="text-sm font-medium text-blue-600 animate-in fade-in zoom-in duration-200">
            {labels[value]}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/0 select-none">Belum dinilai</span>
        )}
      </div>
    </div>
  )
}
