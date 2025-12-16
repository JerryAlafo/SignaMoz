import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname !== '/' && pathname !== '/contact' && !pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}