import {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setUserCookie,
} from "@/lib/auth-cookies"
import type { ApiErrorBody, RefreshResponse } from "@/lib/types"

const getApiUrl = () => {
  const url = process.env.API_URL
  if (!url) {
    throw new Error("API_URL não configurada")
  }
  return url.replace(/\/$/, "")
}

const REQUEST_TIMEOUT_MS = 15000

const isTimeoutError = (error: unknown) =>
  error instanceof Error && error.name === "TimeoutError"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

const parseErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (Array.isArray(body.message)) {
      return body.message.join(", ")
    }
    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message
    }
  } catch {
    // ignore parse errors
  }
  return "Erro ao comunicar com a API"
}

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  let response: Response
  try {
    response = await fetch(`${getApiUrl()}/sessions/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    return null
  }

  if (!response.ok) return null

  const data = (await response.json()) as RefreshResponse
  try {
    await setAccessTokenCookie(data.access_token)
    await setUserCookie(data.user)
  } catch {
    // Cookie writes are only allowed in Route Handlers / Server Actions
  }
  return data.access_token
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  auth?: boolean
}

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> => {
  const { body, auth = true, headers, ...rest } = options
  const url = `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`

  const buildHeaders = (accessToken: string | null): HeadersInit => {
    const nextHeaders: Record<string, string> = {
      ...(headers as Record<string, string> | undefined),
    }

    if (body !== undefined) {
      nextHeaders["Content-Type"] = "application/json"
    }

    if (auth && accessToken) {
      nextHeaders.Authorization = `Bearer ${accessToken}`
    }

    return nextHeaders
  }

  const doFetch = async (accessToken: string | null) =>
    fetch(url, {
      ...rest,
      headers: buildHeaders(accessToken),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

  let accessToken = auth ? await getAccessToken() : null
  let response: Response

  try {
    response = await doFetch(accessToken)
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new ApiError(`Tempo esgotado ao conectar em ${getApiUrl()}.`, 504)
    }
    throw new ApiError(
      `Não foi possível conectar em ${getApiUrl()}. Verifique a API_URL.`,
      503
    )
  }

  if (auth && response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      throw new ApiError("Sessão expirada", 401)
    }
    accessToken = refreshed
    try {
      response = await doFetch(accessToken)
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new ApiError(`Tempo esgotado ao conectar em ${getApiUrl()}.`, 504)
      }
      throw new ApiError(
        `Não foi possível conectar em ${getApiUrl()}. Verifique a API_URL.`,
        503
      )
    }
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    const isMissingUser =
      response.status === 404 &&
      /usu[aá]rio n[aã]o encontrado/i.test(message)

    // Token válido, mas usuário sumiu do banco — trata como sessão inválida
    throw new ApiError(message, isMissingUser ? 401 : response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError("Resposta inválida da API", 502)
  }
}

export const publicApiFetch = async <T>(
  path: string,
  options: Omit<ApiFetchOptions, "auth"> = {}
) => apiFetch<T>(path, { ...options, auth: false })
