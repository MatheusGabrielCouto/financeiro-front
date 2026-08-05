"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, KeyboardEvent, useState } from "react"

type AuthFormProps = {
  mode: "login" | "register"
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isRegister = mode === "register"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister ? { name, email, password } : { email, password }
          ),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível autenticar"
        )
        return
      }

      router.replace("/")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePassword = () => {
    setShowPassword((current) => !current)
  }

  const handleTogglePasswordKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleTogglePassword()
    }
  }

  return (
    <div className="w-full">
      <header className="mb-8">
        <p className="hidden text-sm font-medium text-accent lg:block">
          {isRegister ? "Criar conta" : "Bem-vindo de volta"}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {isRegister ? "Comece a organizar" : "Entrar no Financeiro"}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {isRegister
            ? "Crie sua conta em poucos segundos e monte o panorama do seu mês."
            : "Acesse seu painel com dívidas, contas, caixinhas e insights."}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-teal-900/8 bg-white/90 p-6 shadow-[0_20px_50px_-28px_rgba(15,118,110,0.35)] backdrop-blur-sm sm:p-7"
        aria-label={isRegister ? "Formulário de cadastro" : "Formulário de login"}
      >
        {isRegister ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-800">Nome</span>
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Como podemos te chamar"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              aria-label="Nome completo"
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-800">E-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
            aria-label="E-mail"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-800">Senha</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              minLength={4}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? "Mínimo 4 caracteres" : "Sua senha"}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 pr-20 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              aria-label="Senha"
            />
            <button
              type="button"
              onClick={handleTogglePassword}
              onKeyDown={handleTogglePasswordKeyDown}
              tabIndex={0}
              className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2.5 text-xs font-semibold text-accent transition hover:bg-accent-soft"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </label>

        {error ? (
          <p
            className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:bg-accent-hover disabled:opacity-60"
          aria-label={isRegister ? "Criar conta" : "Entrar"}
        >
          {isLoading
            ? "Aguarde..."
            : isRegister
              ? "Criar conta"
              : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? "Já tem conta?" : "Não tem conta?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-semibold text-accent transition hover:text-accent-hover hover:underline"
          tabIndex={0}
        >
          {isRegister ? "Entrar" : "Cadastre-se"}
        </Link>
      </p>
    </div>
  )
}
