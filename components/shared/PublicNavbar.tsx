'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/shared/I18nProvider'
import { SURVEY_ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function PublicNavbar() {
  const { t, setLocale, locale } = useI18n()
  const [open, setOpen] = useState(false)

  const links = [
    { href: SURVEY_ROUTES.HOME, label: t('nav.home') },
    { href: SURVEY_ROUTES.SURVEI, label: t('nav.survey') },
    { href: SURVEY_ROUTES.HASIL, label: t('nav.results') },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-14 w-full px-6 sm:px-10 lg:px-16 xl:px-20 items-center justify-between">
        <Link href={SURVEY_ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg">
          <span className="text-emerald-700">SIKAP</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm">
                {link.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
          >
            {locale === 'id' ? 'EN' : 'ID'}
          </Button>
        </div>

        <button
          className="flex items-center md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all md:hidden',
          open ? 'max-h-80' : 'max-h-0'
        )}
      >
        <div className="flex flex-col gap-1 border-t px-4 py-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                {link.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setLocale(locale === 'id' ? 'en' : 'id')
              setOpen(false)
            }}
          >
            {locale === 'id' ? 'EN' : 'ID'}
          </Button>
        </div>
      </div>
    </nav>
  )
}
