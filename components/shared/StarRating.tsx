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

export function StarRating({ value, onChange, disabled = false, size = 32 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          whileHover={{ scale: disabled ? 1 : 1.2 }}
          whileTap={{ scale: disabled ? 1 : 0.9 }}
          animate={{
            scale: value >= star ? [1, 1.15, 1] : 1,
          }}
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
  )
}
