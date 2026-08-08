"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { CategorySearchSelect } from "@/components/category-search-select"
import { CurrencyInput } from "@/components/currency-input"
import type { Category } from "@/lib/types"
import { flattenCategories } from "@/lib/ui"

type UpsertBudgetFormProps = {
  categories: Category[]
  month: number
  year: number
}

export const UpsertBudgetForm = ({
  categories,
  month,
  year,
}: UpsertBudgetFormProps) => {
  const router = useRouter()
  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories]
  )
  const [categoryId, setCategoryId] = useState(flatCategories[0]?.id ?? "")
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!categoryId) {
      setError("Selecione uma categoria")
      return
    }

    if (amount <= 0) {
      setError("Informe um valor maior que zero")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          month,
          year,
          amount,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar o orçamento"
        )
        return
      }

      setAmount(0)
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
      aria-label="Definir orçamento por categoria"
    >
      <div>
        <h2 className="text-base font-semibold">Definir limite</h2>
        <p className="mt-1 text-sm text-muted">
          Se a categoria já tiver limite neste mês, o valor é atualizado.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Categoria</span>
        <CategorySearchSelect
          categories={categories}
          value={categoryId}
          onValueChange={setCategoryId}
          ariaLabel="Categoria do orçamento"
          allowEmpty={false}
          required
          placeholder="Buscar categoria..."
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Limite mensal</span>
        <CurrencyInput
          required
          value={amount}
          onValueChange={setAmount}
          ariaLabel="Valor do orçamento"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading || !categoryId}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        aria-label="Salvar orçamento"
      >
        {isLoading ? "Salvando..." : "Salvar limite"}
      </button>
    </form>
  )
}
