import { NextResponse } from "next/server"
import { setAuthCookies } from "@/lib/auth-cookies"
import { publicApiFetch, ApiError } from "@/lib/api-server"
import type { SessionResponse } from "@/lib/types"

export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    const data = await publicApiFetch<SessionResponse>("/sessions/2fa", {
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

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível validar o código",
      },
      { status: 500 }
    )
  }
}
