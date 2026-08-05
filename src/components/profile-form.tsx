"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/format"
import type { User } from "@/lib/types"

type ProfileFormProps = {
  user: User
}

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError("Informe seu nome")
      return
    }

    if (!email.trim()) {
      setError("Informe seu e-mail")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar o perfil"
        )
        return
      }

      setSuccess("Perfil atualizado com sucesso")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 sm:p-6"
      aria-label="Formulário de perfil"
    >
      <div>
        <h2 className="text-base font-semibold">Dados da conta</h2>
        <p className="mt-1 text-sm text-muted">
          Atualize nome e e-mail da sua conta.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome</span>
        <input
          required
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          aria-label="Nome"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">E-mail</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          aria-label="E-mail"
        />
      </label>

      <div className="rounded-xl border border-border bg-background px-3.5 py-3">
        <p className="text-sm font-medium text-slate-800">Saldo disponível</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {formatCurrency(user.amount)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Somente leitura. O saldo muda com pagamentos, receitas e movimentações.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-2.5 text-sm text-accent"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        aria-label="Salvar perfil"
      >
        {isLoading ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  )
}
