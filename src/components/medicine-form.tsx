"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconPill } from "@/components/icons"
import { formatExpiration } from "@/lib/medicine-status"

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
]

const currentYear = new Date().getFullYear()

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent transition focus:ring-2"

export const MedicineForm = () => {
  const router = useRouter()
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("un")
  const [purpose, setPurpose] = useState("")
  const [expirationMonth, setExpirationMonth] = useState(String(new Date().getMonth() + 1))
  const [expirationYear, setExpirationYear] = useState(String(currentYear))
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const purposeTags = useMemo(
    () =>
      purpose
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [purpose]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const quantityValue = Number(quantity)
    const monthValue = Number(expirationMonth)
    const yearValue = Number(expirationYear)

    if (!name.trim()) {
      setError("Informe o nome do remédio")
      return
    }
    if (!Number.isFinite(quantityValue) || quantityValue < 0) {
      setError("Informe uma quantidade válida")
      return
    }
    if (!Number.isFinite(yearValue) || yearValue < 2000) {
      setError("Informe um ano de validade válido")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantityValue,
          unit: unit.trim() || "un",
          purpose: purposeTags,
          expirationMonth: monthValue,
          expirationYear: yearValue,
          notes: notes.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar o remédio"
        )
        return
      }

      setName("")
      setQuantity("")
      setUnit("un")
      setPurpose("")
      setExpirationMonth(String(new Date().getMonth() + 1))
      setExpirationYear(String(currentYear))
      setNotes("")
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Novo remédio">
      <div className="rounded-2xl border border-border/70 bg-accent-soft/20 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <IconPill className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-base font-semibold">
              {name.trim() || "Nome do remédio"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {quantity ? `${quantity} ${unit}` : "Quantidade"} · validade{" "}
              {formatExpiration(Number(expirationMonth), Number(expirationYear) || currentYear)}
            </p>
            {purposeTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {purposeTags.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-border"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Dipirona"
          className={fieldClass}
          aria-label="Nome do remédio"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Quantidade</span>
          <input
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="10"
            className={fieldClass}
            aria-label="Quantidade em estoque"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Unidade</span>
          <input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="comprimidos, ml..."
            className={fieldClass}
            aria-label="Unidade de medida"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Mês de validade</span>
          <select
            value={expirationMonth}
            onChange={(event) => setExpirationMonth(event.target.value)}
            className={fieldClass}
            aria-label="Mês de validade"
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Ano de validade</span>
          <input
            inputMode="numeric"
            value={expirationYear}
            onChange={(event) => setExpirationYear(event.target.value)}
            placeholder={String(currentYear)}
            className={fieldClass}
            aria-label="Ano de validade"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Para que serve</span>
        <input
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          placeholder="Febre, dor de cabeça..."
          className={fieldClass}
          aria-label="Para que serve, separado por vírgula"
        />
        <span className="block text-xs text-muted">Separe por vírgula</span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Observações (opcional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex.: tomar após as refeições"
          rows={2}
          className={`${fieldClass} resize-y`}
          aria-label="Observações"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isLoading ? "Salvando..." : "Adicionar remédio"}
      </button>
    </form>
  )
}
