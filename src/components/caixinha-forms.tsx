"use client"

import { FormEvent, useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { CurrencyInput } from "@/components/currency-input"
import { IconClose } from "@/components/icons"
import { formatCurrency } from "@/lib/format"

export const CreateCaixinhaForm = () => {
  const router = useRouter()
  const [name, setName] = useState("")
  const [value, setValue] = useState(0)
  const [valueAdded, setValueAdded] = useState(0)
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 6)
    return date.toISOString().slice(0, 10)
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (value <= 0) {
      setError("Informe a meta maior que zero")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/future-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          value,
          valueAdded: valueAdded > 0 ? valueAdded : 0,
          dateAcquisition,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar a caixinha"
        )
        return
      }

      setName("")
      setValue(0)
      setValueAdded(0)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40"
      aria-label="Nova caixinha"
    >
      <div>
        <h2 className="text-base font-semibold">Nova caixinha</h2>
        <p className="mt-1 text-sm text-muted">
          Defina um objetivo e uma data para acompanhar o progresso.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome da meta</span>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Viagem, Notebook, Reserva"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome da caixinha"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Valor da meta</span>
        <CurrencyInput
          required
          value={value}
          onValueChange={setValue}
          ariaLabel="Valor da meta"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Depósito inicial (opcional)</span>
        <CurrencyInput
          value={valueAdded}
          onValueChange={setValueAdded}
          ariaLabel="Depósito inicial"
        />
        <span className="block text-xs text-muted">
          Sai do saldo livre e já entra na caixinha.
        </span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Data alvo</span>
        <input
          required
          type="date"
          value={dateAcquisition}
          onChange={(event) => setDateAcquisition(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Data alvo da caixinha"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        aria-label="Criar caixinha"
      >
        {isLoading ? "Criando..." : "Criar caixinha"}
      </button>
    </form>
  )
}

type CaixinhaMoveFormProps = {
  caixinhaId: string
  caixinhaName: string
  mode: "deposit" | "withdraw"
  maxValue?: number
  availableBalance?: number
}

export const CaixinhaMoveForm = ({
  caixinhaId,
  caixinhaName,
  mode,
  maxValue,
  availableBalance,
}: CaixinhaMoveFormProps) => {
  const router = useRouter()
  const titleId = useId()
  const [value, setValue] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isDeposit = mode === "deposit"
  const label = isDeposit ? "Guardar" : "Retirar"
  const path = isDeposit
    ? `/future-purchase/${caixinhaId}/add-value`
    : `/future-purchase/${caixinhaId}/remove-value`

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    setValue(0)
    setError(null)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, isLoading])

  const handleClose = () => {
    if (isLoading) return
    setIsOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (value <= 0) {
      setError("Informe um valor maior que zero")
      return
    }

    if (!isDeposit && typeof maxValue === "number" && value > maxValue) {
      setError("Valor maior que o saldo da caixinha")
      return
    }

    if (
      isDeposit &&
      typeof availableBalance === "number" &&
      value > availableBalance
    ) {
      setError("Saldo livre insuficiente")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : `Não foi possível ${label.toLowerCase()}`
        )
        return
      }

      setValue(0)
      setIsOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const modal =
    mounted && isOpen
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              aria-label="Fechar"
              onClick={handleClose}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-slate-900/15 md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id={titleId}
                    className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
                  >
                    {label} em {caixinhaName}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {isDeposit
                      ? "O valor sai do saldo livre e entra nesta caixinha."
                      : "O valor volta da caixinha para o saldo livre."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-lg border border-border p-2 text-muted transition hover:bg-slate-50 hover:text-foreground disabled:opacity-60 dark:hover:bg-slate-800"
                  aria-label="Fechar"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Valor</span>
                  <CurrencyInput
                    required
                    value={value}
                    onValueChange={setValue}
                    ariaLabel={`Valor para ${label.toLowerCase()}`}
                  />
                </label>

                <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted dark:bg-slate-900/50">
                  {isDeposit ? (
                    <p>
                      Saldo livre disponível:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(availableBalance ?? 0)}
                      </span>
                    </p>
                  ) : (
                    <p>
                      Saldo nesta caixinha:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(maxValue ?? 0)}
                      </span>
                    </p>
                  )}
                </div>

                {error ? (
                  <p
                    className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
                  >
                    {isLoading ? "Confirmando..." : `Confirmar ${label.toLowerCase()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
          isDeposit
            ? "border-transparent bg-accent text-white hover:bg-accent-hover"
            : "border-border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
        aria-label={`${label} na caixinha ${caixinhaName}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {label}
      </button>
      {modal}
    </>
  )
}
