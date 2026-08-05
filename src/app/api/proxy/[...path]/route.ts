import { NextRequest, NextResponse } from "next/server"
import { apiFetch, ApiError } from "@/lib/api-server"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const handler = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params
  const targetPath = `/${path.join("/")}`
  const search = request.nextUrl.search
  const fullPath = `${targetPath}${search}`

  let body: unknown = undefined
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text()
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        return NextResponse.json(
          { message: "Body JSON inválido" },
          { status: 400 }
        )
      }
    }
  }

  try {
    const data = await apiFetch(fullPath, {
      method: request.method,
      body,
    })

    if (data === undefined) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { message: "Erro no proxy da API" },
      { status: 500 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
