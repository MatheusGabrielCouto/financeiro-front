"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCardVisual } from "@/components/credit-card-visual"
import { CurrencyInput } from "@/components/currency-input"

export const CreateCreditCardForm = () => {
  const router = useRouter()
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [limit, setLimit] = useState(0)
  const [closingDay, setClosingDay] = useState("1")
  const [dueDay, setDueDay] = useState("10")
  const [lastDigits, setLastDigits] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const closing = Number(closingDay)
    const due = Number(dueDay)

    if (!name.trim()) {
      setError("Informe o nome do cartão")
      return
    }
    if (limit <= 0) {
      setError("Informe um limite válido")
      return
    }
    if (!Number.isFinite(closing) || closing < 1 || closing > 31) {
      setError("Dia de fechamento inválido")
      return
    }
    if (!Number.isFinite(due) || due < 1 || due > 31) {
      setError("Dia de vencimento inválido")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/proxy/credit-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || null,
          limit,
          closingDay: closing,
          dueDay: due,
          lastDigits: lastDigits.trim() || null,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          typeof payload.message === "string"
            ? payload.message
            : "Não foi possível criar o cartão"
        )
        return
      }
      router.push(`/financeiro/cartoes/${payload.id}`)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const closing = Number(closingDay)
  const due = Number(dueDay)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Pré-visualização
        </p>
        <CreditCardVisual
          name={name || "Seu cartão"}
          brand={brand || "Bandeira"}
          lastDigits={lastDigits || "0000"}
          closingDay={
            Number.isFinite(closing) && closing >= 1 && closing <= 31
              ? closing
              : undefined
          }
          dueDay={
            Number.isFinite(due) && due >= 1 && due <= 31 ? due : undefined
          }
          available={limit > 0 ? limit : null}
          size="md"
          className="max-w-none"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border/70 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            Dados do cartão
          </h2>
          <p className="mt-1 text-sm text-muted">
            Limite, fechamento e vencimento — o visual atualiza em tempo real.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            aria-label="Nome do cartão"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent"
            placeholder="Nubank, Inter..."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Bandeira</span>
            <input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              aria-label="Bandeira do cartão"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent"
              placeholder="Visa, Mastercard..."
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Finais</span>
            <input
              value={lastDigits}
              onChange={(event) =>
                setLastDigits(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              aria-label="Últimos dígitos"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent"
              placeholder="1234"
              inputMode="numeric"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Limite</span>
          <CurrencyInput
            value={limit}
            onValueChange={setLimit}
            ariaLabel="Limite do cartão"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Fecha dia</span>
            <input
              type="number"
              min={1}
              max={31}
              value={closingDay}
              onChange={(event) => setClosingDay(event.target.value)}
              required
              aria-label="Dia de fechamento"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Vence dia</span>
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
              required
              aria-label="Dia de vencimento"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent"
            />
          </label>
        </div>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {isLoading ? "Salvando..." : "Criar cartão"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/financeiro/cartoes")}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
