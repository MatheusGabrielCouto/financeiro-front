"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"
import { CategorySearchSelect } from "@/components/category-search-select"
import type { Category } from "@/lib/types"

type RecurringFormsProps = {
  categories: Category[]
}

export const CreateRecurringIncomeForm = () => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [value, setValue] = useState(0)
  const [dayOfMonth, setDayOfMonth] = useState("5")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (value <= 0) {
      setError("Informe um valor maior que zero")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/recurring-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          value,
          dayOfMonth: Number(dayOfMonth),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar a receita"
        )
        return
      }

      setTitle("")
      setValue(0)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Nova receita fixa">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome da receita</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Salário"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome da receita fixa"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Valor mensal</span>
          <CurrencyInput
            required
            value={value}
            onValueChange={setValue}
            ariaLabel="Valor da receita fixa"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Dia do crédito</span>
          <input
            required
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(event) => setDayOfMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Dia do mês da receita"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        aria-label="Salvar receita fixa"
      >
        {isLoading ? "Salvando..." : "Adicionar receita"}
      </button>
    </form>
  )
}

export const CreateRecurringPaymentForm = ({
  categories,
}: RecurringFormsProps) => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [value, setValue] = useState(0)
  const [dayOfMonth, setDayOfMonth] = useState("10")
  const [categoryId, setCategoryId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (value <= 0) {
      setError("Informe um valor maior que zero")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/recurring-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          value,
          dayOfMonth: Number(dayOfMonth),
          categoryId: categoryId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar a conta fixa"
        )
        return
      }

      setTitle("")
      setValue(0)
      setCategoryId("")
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Nova conta fixa">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome da conta</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Aluguel, Internet, Netflix"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome da conta fixa"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Valor mensal</span>
          <CurrencyInput
            required
            value={value}
            onValueChange={setValue}
            ariaLabel="Valor da conta fixa"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Dia do vencimento</span>
          <input
            required
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(event) => setDayOfMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Dia do vencimento da conta fixa"
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Categoria</span>
        <CategorySearchSelect
          categories={categories}
          value={categoryId}
          onValueChange={setCategoryId}
          ariaLabel="Categoria da conta fixa"
          allowEmpty
          emptyLabel="Sem categoria"
          placeholder="Buscar categoria..."
        />
      </label>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        aria-label="Salvar conta fixa"
      >
        {isLoading ? "Salvando..." : "Adicionar conta fixa"}
      </button>
    </form>
  )
}
