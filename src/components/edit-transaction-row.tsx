"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useCallback, useState } from "react"
import { CategorySearchSelect } from "@/components/category-search-select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { formatCurrency, formatDate } from "@/lib/format"
import { transactionTypeLabel } from "@/lib/ui"
import type { Category, Transaction } from "@/lib/types"

type EditTransactionRowProps = {
  transaction: Transaction
  categories: Category[]
}

const typeBadgeClass = (type: Transaction["type"]) => {
  if (type === "CREDIT") return "bg-emerald-50 text-success dark:bg-emerald-950/40"
  if (type === "PAY") return "bg-teal-50 text-accent dark:bg-teal-950/40"
  return "bg-amber-50 text-warning dark:bg-amber-950/40"
}

const typeDotClass = (type: Transaction["type"]) => {
  if (type === "CREDIT") return "bg-emerald-500"
  if (type === "PAY") return "bg-accent"
  return "bg-amber-500"
}

export const EditTransactionRow = ({
  transaction,
  categories,
}: EditTransactionRowProps) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState(transaction.message)
  const [categoryId, setCategoryId] = useState(
    transaction.categories?.[0]?.id ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const isCredit = transaction.type === "CREDIT"

  const handleCancelDelete = useCallback(() => {
    if (isLoading) return
    setIsConfirmOpen(false)
  }, [isLoading])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/transaction/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          categories: categoryId ? [categoryId] : [],
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível atualizar"
        )
        return
      }

      setIsEditing(false)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/proxy/transaction/${transaction.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível excluir"
        )
        setIsConfirmOpen(false)
        return
      }

      setIsConfirmOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão")
      setIsConfirmOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-xl border border-border/80 bg-background/60 px-4 py-3">
        <form onSubmit={handleSave} className="space-y-3">
          <input
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Descrição do lançamento"
          />
          <CategorySearchSelect
            categories={categories}
            value={categoryId}
            onValueChange={setCategoryId}
            ariaLabel="Categoria do lançamento"
            allowEmpty
            emptyLabel="Sem categoria"
            placeholder="Buscar categoria..."
          />
          {error ? (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="rounded-xl border border-border/80 bg-background/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${typeDotClass(transaction.type)}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{transaction.message}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span
                className={`rounded-md px-1.5 py-0.5 font-medium ${typeBadgeClass(transaction.type)}`}
              >
                {transactionTypeLabel(transaction.type)}
              </span>
              <span>
                {transaction.categories?.length
                  ? transaction.categories.map((item) => item.title).join(", ")
                  : "Sem categoria"}
              </span>
              <span className="hidden sm:inline">
                {formatDate(transaction.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold tabular-nums ${
              isCredit ? "text-success" : "text-danger"
            }`}
          >
            {isCredit ? "+" : "−"}
            {formatCurrency(transaction.value)}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900/50"
            aria-label={`Editar lançamento ${transaction.message}`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isLoading}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-danger hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/40"
            aria-label={`Excluir lançamento ${transaction.message}`}
          >
            Excluir
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={isConfirmOpen}
        title="Excluir lançamento"
        description={`Você está prestes a excluir "${transaction.message}". O saldo será revertido. Esta ação não pode ser desfeita.`}
        isLoading={isLoading}
        onCancel={handleCancelDelete}
        onConfirm={() => void handleDelete()}
      />
    </li>
  )
}
