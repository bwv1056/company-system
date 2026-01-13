import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const publicPaths = ['/login', '/api/v1/auth/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check authentication
  const session = await getSessionFromRequest(request)

  if (!session) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: '認証が必要です' } },
        { status: 401 }
      )
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check manager-only routes
  const managerOnlyPaths = ['/sales-persons', '/api/v1/sales-persons']
  const isManagerOnlyPath = managerOnlyPaths.some(path => pathname.startsWith(path))

  if (isManagerOnlyPath && !session.isManager) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'PERMISSION_DENIED', message: '権限がありません' } },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
