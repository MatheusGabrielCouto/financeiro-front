import { cookies } from "next/headers"
import type { NextResponse } from "next/server"
import type { User } from "@/lib/types"

export const ACCESS_TOKEN_COOKIE = "access_token"
export const REFRESH_TOKEN_COOKIE = "refresh_token"
export const USER_COOKIE = "user"
export const ONBOARDING_COOKIE = "onboarding_done"

const isProduction = process.env.NODE_ENV === "production"

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
}

export const setAuthCookies = (
  response: NextResponse,
  tokens: {
    accessToken: string
    refreshToken: string
    user: User
  }
) => {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })

  response.cookies.set(USER_COOKIE, JSON.stringify(tokens.user), {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })
}

export const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  })
  response.cookies.set(USER_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  })
  response.cookies.set(ONBOARDING_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  })
}

export const getAccessToken = async () => {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export const getRefreshToken = async () => {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

export const getStoredUser = async (): Promise<User | null> => {
  const cookieStore = await cookies()
  const raw = cookieStore.get(USER_COOKIE)?.value
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const setAccessTokenCookie = async (accessToken: string) => {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })
}

export const setUserCookie = async (user: User) => {
  const cookieStore = await cookies()
  cookieStore.set(USER_COOKIE, JSON.stringify(user), {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  })
}

export const isOnboardingDone = async () => {
  const cookieStore = await cookies()
  return cookieStore.get(ONBOARDING_COOKIE)?.value === "1"
}

export const setOnboardingDoneCookie = (response: NextResponse) => {
  response.cookies.set(ONBOARDING_COOKIE, "1", {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 365,
  })
}
