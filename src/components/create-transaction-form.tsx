"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"
import { CategorySearchSelect } from "@/components/category-search-select"
import type { Category, TransactionType } from "@/lib/types"

type CreateTransactionFormProps = {
  categories: Category[]
}

const typeOptions: Array<{
  value: TransactionType
  label: string
  hint: string
}> = [
  { value: "CREDIT", label: "Entrada", hint: "Receita" },
  { value: "DEBIT", label: "Saída", hint: "Gasto" },
  { value: "PAY", label: "Pagamento", hint: "Quitação" },
]

export const CreateTransactionForm = ({
  categories,
}: CreateTransactionFormProps) => {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [value, setValue] = useState(0)
  const [type, setType] = useState<TransactionType>("DEBIT")
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
      const response = await fetch("/api/proxy/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          value,
          type,
          categories: categoryId ? [categoryId] : [],
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar o lançamento"
        )
        return
      }

      setMessage("")
      setValue(0)
      setCategoryId("")
      setType("DEBIT")
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
      className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40"
      aria-label="Novo lançamento"
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold">Novo lançamento</h2>
        <p className="mt-1 text-sm text-muted">
          Registre e atualize o saldo da conta.
        </p>
      </div>

      <div className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Tipo</legend>
          <div className="grid grid-cols-3 gap-2">
            {typeOptions.map((option) => {
              const isActive = type === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${
                    isActive
                      ? option.value === "CREDIT"
                        ? "border-emerald-300 bg-emerald-50 text-success"
                        : option.value === "PAY"
                          ? "border-teal-300 bg-teal-50 text-accent"
                          : "border-amber-300 bg-amber-50 text-warning"
                      : "border-border bg-background text-muted hover:border-slate-300"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Selecionar tipo ${option.label}`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] opacity-80">
                    {option.hint}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Descrição</span>
          <input
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ex.: Mercado, salário, uber..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent placeholder:text-slate-400 focus:ring-2"
            aria-label="Descrição do lançamento"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Valor</span>
          <CurrencyInput
            required
            value={value}
            onValueChange={setValue}
            ariaLabel="Valor do lançamento"
            placeholder="R$ 0,00"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Categoria</span>
          <CategorySearchSelect
            categories={categories}
            value={categoryId}
            onValueChange={setCategoryId}
            ariaLabel="Categoria do lançamento"
            allowEmpty
            emptyLabel="Sem categoria"
            placeholder="Buscar categoria..."
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          aria-label="Salvar lançamento"
        >
          {isLoading ? "Salvando..." : "Salvar lançamento"}
        </button>
      </div>
    </form>
  )
}
