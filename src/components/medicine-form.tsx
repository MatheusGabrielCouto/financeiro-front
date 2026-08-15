"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

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
          purpose: purpose
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
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
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Dipirona"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome do remédio"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Quantidade</span>
          <input
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="10"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Quantidade em estoque"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Unidade</span>
          <input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="comprimidos, ml..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Unidade de medida"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Mês de validade</span>
          <select
            value={expirationMonth}
            onChange={(event) => setExpirationMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Mês de validade"
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Ano de validade</span>
          <input
            inputMode="numeric"
            value={expirationYear}
            onChange={(event) => setExpirationYear(event.target.value)}
            placeholder={String(currentYear)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Ano de validade"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Para que serve</span>
        <input
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          placeholder="Febre, dor de cabeça..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Para que serve, separado por vírgula"
        />
        <span className="block text-xs text-muted">Separe por vírgula</span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Observações (opcional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex.: tomar após as refeições"
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Observações"
        />
      </label>

      {error ? (
        <p className="text-sm text-danger" role="alert">
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
