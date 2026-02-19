import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Permitir rotas de SEO
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    return NextResponse.next()
  }
  
  // Permitir rotas conhecidas
  if (pathname !== '/' && pathname !== '/contact' && !pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}