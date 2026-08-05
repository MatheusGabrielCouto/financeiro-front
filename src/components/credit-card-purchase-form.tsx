"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CurrencyInput } from "@/components/currency-input"

type CreditCardPurchaseFormProps = {
  cardId: string
}

export const CreditCardPurchaseForm = ({
  cardId,
}: CreditCardPurchaseFormProps) => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [value, setValue] = useState(0)
  const [installmentsCount, setInstallmentsCount] = useState("1")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const count = Number(installmentsCount)
    if (!title.trim()) {
      setError("Informe o título da compra")
      return
    }
    if (value <= 0) {
      setError("Informe um valor válido")
      return
    }
    if (!Number.isFinite(count) || count < 1) {
      setError("Número de parcelas inválido")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/proxy/credit-card/${cardId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          value,
          installmentsCount: count,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          typeof payload.message === "string"
            ? payload.message
            : "Não foi possível registrar a compra"
        )
        return
      }
      setTitle("")
      setDescription("")
      setValue(0)
      setInstallmentsCount("1")
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
      className="space-y-4 overflow-hidden rounded-3xl border border-border/70 bg-surface p-5 shadow-sm shadow-slate-200/40"
    >
      <div className="border-b border-border/70 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          Lançamento
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          Nova compra
        </h3>
        <p className="mt-0.5 text-sm text-muted">
          Gera as parcelas na fatura deste cartão.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Título</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          aria-label="Título da compra"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
          placeholder="Mercado, viagem..."
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Descrição</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-label="Descrição da compra"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
          placeholder="Opcional"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Valor</span>
          <CurrencyInput
            value={value}
            onValueChange={setValue}
            ariaLabel="Valor da compra"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Parcelas</span>
          <input
            type="number"
            min={1}
            value={installmentsCount}
            onChange={(event) => setInstallmentsCount(event.target.value)}
            required
            aria-label="Número de parcelas"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isLoading ? "Registrando..." : "Registrar compra"}
      </button>
    </form>
  )
}
