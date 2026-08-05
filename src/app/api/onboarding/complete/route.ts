import { NextRequest, NextResponse } from "next/server"
import { setOnboardingDoneCookie } from "@/lib/auth-cookies"

const resolveRedirectPath = (from: string | null) => {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return "/"
  }
  return from
}

export const POST = async () => {
  const response = NextResponse.json({ success: true })
  setOnboardingDoneCookie(response)
  return response
}

export const GET = async (request: NextRequest) => {
  const from = request.nextUrl.searchParams.get("from")
  const response = NextResponse.redirect(
    new URL(resolveRedirectPath(from), request.url)
  )
  setOnboardingDoneCookie(response)
  return response
}
