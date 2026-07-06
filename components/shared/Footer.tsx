'use client'

import { useI18n } from '@/components/shared/I18nProvider'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t bg-gray-100 py-6 text-center text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">{t('common.app_name')}</p>
      <p>{t('common.app_full')}</p>
      <p className="mt-1">{t('common.subtitle')}</p>
      <p className="mt-3">&copy; {new Date().getFullYear()} Kemenag Barito Utara</p>
    </footer>
  )
}
