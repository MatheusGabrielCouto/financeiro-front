import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-cookies"

const publicPaths = ["/login", "/register"]

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const hasAccess = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)
  const hasRefresh = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value)
  const hasSession = hasAccess || hasRefresh

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isApiAuth = pathname.startsWith("/api/auth/")

  if (isApiAuth) {
    return NextResponse.next()
  }

  if (!hasAccess && hasRefresh && !pathname.startsWith("/api/")) {
    const refreshUrl = new URL("/api/auth/refresh", request.url)
    refreshUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(refreshUrl)
  }

  if (!hasSession && !isPublicPath && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
