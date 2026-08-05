import { NextResponse } from "next/server"
import { setAuthCookies } from "@/lib/auth-cookies"
import { publicApiFetch, ApiError } from "@/lib/api-server"
import type { SessionResponse } from "@/lib/types"

export const POST = async (request: Request) => {
  try {
    const body = await request.json()

    await publicApiFetch<void>("/accounts", {
      method: "POST",
      body,
    })

    const session = await publicApiFetch<SessionResponse>("/sessions", {
      method: "POST",
      body: {
        email: body.email,
        password: body.password,
      },
    })

    const response = NextResponse.json({
      user: session.user,
    })

    setAuthCookies(response, {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: session.user,
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
      { message: "Não foi possível criar a conta" },
      { status: 500 }
    )
  }
}
