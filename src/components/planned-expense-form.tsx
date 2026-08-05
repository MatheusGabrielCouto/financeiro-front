"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CategorySearchSelect } from "@/components/category-search-select"
import { CurrencyInput } from "@/components/currency-input"
import type { Category } from "@/lib/types"

type CreatePlannedExpenseFormProps = {
  categories: Category[]
  defaultDueDate?: string
}

const toInputDate = (value = new Date()) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const CreatePlannedExpenseForm = ({
  categories,
  defaultDueDate,
}: CreatePlannedExpenseFormProps) => {
  const router = useRouter()
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [value, setValue] = useState(0)
  const [dueDate, setDueDate] = useState(
    defaultDueDate ?? toInputDate(nextMonth)
  )
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
      const response = await fetch("/api/proxy/planned-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          value,
          dueDate,
          categoryId: categoryId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar o gasto previsto"
        )
        return
      }

      setTitle("")
      setNotes("")
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
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
      aria-label="Novo gasto previsto"
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome do gasto</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Passagem de avião"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome do gasto previsto"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Valor</span>
          <CurrencyInput
            required
            value={value}
            onValueChange={setValue}
            ariaLabel="Valor do gasto previsto"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Data prevista</span>
          <input
            required
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Data prevista do gasto"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Observação (opcional)</span>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex.: Viagem de férias"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Observação do gasto previsto"
        />
      </label>

      <CategorySearchSelect
        categories={categories}
        value={categoryId}
        onValueChange={setCategoryId}
        ariaLabel="Categoria do gasto previsto"
        allowEmpty
        emptyLabel="Sem categoria"
        placeholder="Buscar categoria..."
      />

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
        {isLoading ? "Salvando..." : "Adicionar gasto previsto"}
      </button>
    </form>
  )
}
