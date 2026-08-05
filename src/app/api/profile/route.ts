import { NextResponse } from "next/server"
import { ApiError } from "@/lib/api-server"
import { USER_COOKIE } from "@/lib/auth-cookies"
import { updateCurrentUser } from "@/lib/finance-api"

const isProduction = process.env.NODE_ENV === "production"

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json()
    const user = await updateCurrentUser({
      name: typeof body.name === "string" ? body.name : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
    })

    const response = NextResponse.json({ user })
    response.cookies.set(USER_COOKIE, JSON.stringify(user), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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
      { message: "Não foi possível atualizar o perfil" },
      { status: 500 }
    )
  }
}
