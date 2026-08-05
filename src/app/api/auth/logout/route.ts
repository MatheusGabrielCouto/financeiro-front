import { NextRequest, NextResponse } from "next/server"
import {
  clearAuthCookies,
  getRefreshToken,
} from "@/lib/auth-cookies"
import { publicApiFetch } from "@/lib/api-server"

const clearSession = async () => {
  const refreshToken = await getRefreshToken()

  if (refreshToken) {
    try {
      await publicApiFetch("/sessions/logout", {
        method: "POST",
        body: { refresh_token: refreshToken },
      })
    } catch {
      // still clear local session
    }
  }
}

export const POST = async () => {
  await clearSession()

  const response = NextResponse.json({ success: true })
  clearAuthCookies(response)
  return response
}

export const GET = async (request: NextRequest) => {
  await clearSession()

  const response = NextResponse.redirect(new URL("/login", request.url))
  clearAuthCookies(response)
  return response
}
