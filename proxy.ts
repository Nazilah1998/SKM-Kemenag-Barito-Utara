import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow health endpoint without maintenance check (required for Coolify)
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  try {
    const pusdatinUrl = process.env.NEXT_PUBLIC_PUSDATIN_URL || "https://pusdatin.kemenag-baritoutara.com";
    const appId = 'sikap';
    
    const maintenanceRes = await fetch(`${pusdatinUrl}/api/public/apps/${appId}/status`, {
      next: { revalidate: 30 }
    });

    if (maintenanceRes.ok) {
      const data = await maintenanceRes.json();
      if (data.status === 'maintenance') {
        return new NextResponse(`
          <!DOCTYPE html>
          <html lang="id">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Sistem Sedang Pemeliharaan</title>
              <link rel="icon" href="${pusdatinUrl}/branding/kemenag.svg" type="image/svg+xml">
              <style>
                body { margin: 0; overflow: hidden; background-color: #f8fafc; }
                iframe { width: 100vw; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pusdatinUrl}/maintenance?app=Survei+Kemenag" title="Maintenance"></iframe>
            </body>
          </html>
        `, {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
    }
  } catch (error) {
    console.error("[PROXY] Failed to fetch maintenance status:", error);
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
