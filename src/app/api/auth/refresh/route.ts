import { NextRequest, NextResponse } from "next/server"
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
  clearAuthCookies,
} from "@/lib/auth-cookies"
import type { RefreshResponse } from "@/lib/types"

const getApiUrl = () => {
  const url = process.env.API_URL
  if (!url) throw new Error("API_URL não configurada")
  return url.replace(/\/$/, "")
}

export const GET = async (request: NextRequest) => {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const from = request.nextUrl.searchParams.get("from") || "/"

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    clearAuthCookies(response)
    return response
  }

  try {
    const apiResponse = await fetch(`${getApiUrl()}/sessions/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    })

    if (!apiResponse.ok) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      clearAuthCookies(response)
      return response
    }

    const data = (await apiResponse.json()) as RefreshResponse
    const response = NextResponse.redirect(new URL(from, request.url))
    const isProduction = process.env.NODE_ENV === "production"
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }

    response.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, cookieOptions)
    response.cookies.set(USER_COOKIE, JSON.stringify(data.user), cookieOptions)
    return response
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url))
    clearAuthCookies(response)
    return response
  }
}
