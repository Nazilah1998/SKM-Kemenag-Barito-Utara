'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/components/shared/I18nProvider'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export function SurveyThankYou() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-10 text-green-600" />
          </div>
          <CardTitle className="text-xl">{t('survey.thank_you')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('survey.thank_you_desc')}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/survei">
            <Button variant="default">{t('survey.fill_again')}</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
