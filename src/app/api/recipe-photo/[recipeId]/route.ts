import { getAccessToken } from "@/lib/auth-cookies"
import { NextRequest, NextResponse } from "next/server"

const getApiUrl = () => {
  const url = process.env.API_URL
  if (!url) throw new Error("API_URL não configurada")
  return url.replace(/\/$/, "")
}

type RouteContext = {
  params: Promise<{ recipeId: string }>
}

export const POST = async (request: NextRequest, context: RouteContext) => {
  const { recipeId } = await context.params
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  }

  const formData = await request.formData()
  const response = await fetch(`${getApiUrl()}/recipe/${recipeId}/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const text = await response.text()
  if (!response.ok) {
    try {
      return NextResponse.json(JSON.parse(text), { status: response.status })
    } catch {
      return NextResponse.json({ message: "Erro ao enviar foto" }, { status: response.status })
    }
  }

  return NextResponse.json(text ? JSON.parse(text) : null)
}
