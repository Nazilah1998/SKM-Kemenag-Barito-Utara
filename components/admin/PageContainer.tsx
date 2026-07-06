'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface PageContainerProps {
  children: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageContainer({ children, title, description, action }: PageContainerProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  )
}
