'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import idMessages from '@/messages/id.json'
import enMessages from '@/messages/en.json'

type Messages = typeof idMessages

const messages: Record<string, Messages> = { id: idMessages, en: enMessages }

type TFunction = (key: string) => string

interface I18nContext {
  t: TFunction
  locale: string
  setLocale: (l: string) => void
}

const I18nContext = createContext<I18nContext>({
  t: (key) => key,
  locale: 'id',
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('id')

  useEffect(() => {
    const cookie = document.cookie.split('; ').find((r) => r.startsWith('locale='))
    if (cookie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(cookie.split('=')[1])
    }
  }, [])

  const setLocale = useCallback((l: string) => {
    document.cookie = `locale=${l}; path=/; max-age=31536000`
    setLocaleState(l)
    window.location.reload()
  }, [])

  const t: TFunction = useCallback(
    (key) => {
      const keys = key.split('.')
      let value: unknown = messages[locale]
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k]
        } else {
          return key
        }
      }
      return (value as string) || key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
