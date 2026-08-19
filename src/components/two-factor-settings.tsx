"use client"

import { FormEvent, KeyboardEvent, useState } from "react"
import { useRouter } from "next/navigation"
import type { TwoFactorSetupResponse } from "@/lib/types"

type TwoFactorSettingsProps = {
  totpEnabled: boolean
}

type SetupState = "idle" | "setup" | "backup" | "disable"

export const TwoFactorSettings = ({ totpEnabled }: TwoFactorSettingsProps) => {
  const router = useRouter()
  const [enabled, setEnabled] = useState(totpEnabled)
  const [view, setView] = useState<SetupState>("idle")
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const resetMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const handleStartSetup = async () => {
    resetMessages()
    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/user/2fa/setup", {
        method: "POST",
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível iniciar o 2FA"
        )
        return
      }

      setSetup(data as TwoFactorSetupResponse)
      setCode("")
      setView("setup")
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/user/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível ativar o 2FA"
        )
        return
      }

      setEnabled(true)
      setBackupCodes(
        Array.isArray(data.backupCodes) ? (data.backupCodes as string[]) : []
      )
      setSetup(null)
      setCode("")
      setView("backup")
      setSuccess("Autenticação em duas etapas ativada")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          code: code.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível desativar o 2FA"
        )
        return
      }

      setEnabled(false)
      setPassword("")
      setCode("")
      setView("idle")
      setSuccess("Autenticação em duas etapas desativada")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopySecret = async () => {
    if (!setup?.secret) return
    try {
      await navigator.clipboard.writeText(setup.secret)
      setCopiedSecret(true)
      window.setTimeout(() => setCopiedSecret(false), 2000)
    } catch {
      setError("Não foi possível copiar a chave")
    }
  }

  const handleCopySecretKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      void handleCopySecret()
    }
  }

  const handleCancelSetup = () => {
    setSetup(null)
    setCode("")
    setView("idle")
    resetMessages()
  }

  return (
    <section
      className="space-y-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 sm:p-6"
      aria-label="Autenticação em duas etapas"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Segurança</h2>
          <p className="mt-1 text-sm text-muted">
            O 2FA protege somente o login. Depois de entrar, o restante do
            painel segue normal.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
            enabled
              ? "bg-emerald-50 text-success"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {enabled ? "Ativado" : "Desativado"}
        </span>
      </div>

      {view === "idle" && !enabled ? (
        <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-muted">
          Use Google Authenticator, Authy ou 1Password. No próximo login você
          vai precisar do código de 6 dígitos.
        </div>
      ) : null}

      {view === "setup" && setup ? (
        <form onSubmit={handleEnable} className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-background p-4">
            <p className="text-sm font-medium">Escaneie o QR Code</p>
            <p className="mt-1 text-xs text-muted">
              Abra o autenticador e aponte a câmera para o código.
            </p>
            <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
              <img
                src={setup.qrCode}
                alt="QR Code para ativar a autenticação em duas etapas"
                className="h-[180px] w-[180px]"
              />
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-muted">
                Ou digite a chave manualmente
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs tracking-wide dark:bg-slate-800">
                  {setup.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  onKeyDown={handleCopySecretKeyDown}
                  tabIndex={0}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  aria-label="Copiar chave secreta do autenticador"
                >
                  {copiedSecret ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Código de 6 dígitos</span>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 font-mono text-sm tracking-[0.3em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              aria-label="Código de 6 dígitos do autenticador"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
              aria-label="Confirmar e ativar 2FA"
            >
              {isLoading ? "Confirmando..." : "Ativar 2FA"}
            </button>
            <button
              type="button"
              onClick={handleCancelSetup}
              tabIndex={0}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
              aria-label="Cancelar ativação do 2FA"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {view === "backup" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <p className="text-sm font-semibold text-warning">
              Guarde os códigos de backup
            </p>
            <p className="mt-1 text-xs text-muted">
              Cada código funciona uma vez, se você perder o autenticador. Eles
              não aparecem de novo.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((backupCode) => (
                <li
                  key={backupCode}
                  className="rounded-lg bg-white px-3 py-2 text-center dark:bg-slate-900"
                >
                  {backupCode}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setView("idle")
              setBackupCodes([])
            }}
            tabIndex={0}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
            aria-label="Concluir configuração do 2FA"
          >
            Já guardei os códigos
          </button>
        </div>
      ) : null}

      {view === "disable" ? (
        <form onSubmit={handleDisable} className="space-y-4">
          <p className="text-sm text-muted">
            Confirme sua senha e o código atual para desativar o 2FA.
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Senha</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              aria-label="Senha da conta"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Código do autenticador</span>
            <input
              required
              value={code}
              onChange={(event) => setCode(event.target.value.slice(0, 16))}
              placeholder="000000"
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 font-mono text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              aria-label="Código do autenticador ou backup"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:hover:bg-red-950/30"
              aria-label="Desativar autenticação em duas etapas"
            >
              {isLoading ? "Desativando..." : "Desativar 2FA"}
            </button>
            <button
              type="button"
              onClick={() => {
                setView("idle")
                setPassword("")
                setCode("")
                resetMessages()
              }}
              tabIndex={0}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
              aria-label="Cancelar desativação do 2FA"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {view === "idle" ? (
        <div className="flex flex-wrap gap-2">
          {enabled ? (
            <button
              type="button"
              onClick={() => {
                resetMessages()
                setCode("")
                setPassword("")
                setView("disable")
              }}
              tabIndex={0}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
              aria-label="Desativar autenticação em duas etapas"
            >
              Desativar 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={isLoading}
              tabIndex={0}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
              aria-label="Ativar autenticação em duas etapas"
            >
              {isLoading ? "Gerando QR Code..." : "Ativar 2FA"}
            </button>
          )}
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-danger dark:border-red-900/40 dark:bg-red-950/40"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success && view !== "backup" ? (
        <p
          className="rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-2.5 text-sm text-accent dark:border-teal-900/40 dark:bg-teal-950/40"
          role="status"
        >
          {success}
        </p>
      ) : null}
    </section>
  )
}
