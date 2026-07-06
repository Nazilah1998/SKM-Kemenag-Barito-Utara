'use server'

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false

  try {
    const secret = process.env.TURNSTILE_SECRET_KEY

    if (!secret) {
      console.error('Missing Turnstile Secret Key in .env')
      return false
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    })

    const result = await res.json()
    return result.success === true
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}
