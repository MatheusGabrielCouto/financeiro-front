import { NextResponse } from "next/server"
import {
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth-cookies"
import { publicApiFetch, ApiError } from "@/lib/api-server"
import type { SessionResponse } from "@/lib/types"

export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    const data = await publicApiFetch<SessionResponse>("/sessions", {
      method: "POST",
      body,
    })

    const response = NextResponse.json({
      user: data.user,
    })

    setAuthCookies(response, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    })

    return response
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }

    console.error("[auth/login]", error)
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível autenticar",
      },
      { status: 500 }
    )
  }
}

export const DELETE = async () => {
  const response = NextResponse.json({ success: true })
  clearAuthCookies(response)
  return response
}
