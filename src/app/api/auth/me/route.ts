import { NextResponse } from "next/server"
import { getStoredUser } from "@/lib/auth-cookies"

export const GET = async () => {
  const user = await getStoredUser()

  if (!user) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  }

  return NextResponse.json({ user })
}
