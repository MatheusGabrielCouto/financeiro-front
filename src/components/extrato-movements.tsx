"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { EditTransactionRow } from "@/components/edit-transaction-row"
import { formatCurrency } from "@/lib/format"
import type { Category, Transaction } from "@/lib/types"

type ExtratoMovementsProps = {
  transactions: Transaction[]
  categories: Category[]
}

const groupByDay = (transactions: Transaction[]) => {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const key = new Date(transaction.createdAt).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const current = groups.get(key) ?? []
    current.push(transaction)
    groups.set(key, current)
  }

  return Array.from(groups.entries())
}

export const ExtratoMovements = ({
  transactions,
  categories,
}: ExtratoMovementsProps) => {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (searchParams.get("focus") === "search") {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [searchParams])

  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener("financeiro:focus-extrato-search", handleFocus)
    return () => {
      window.removeEventListener("financeiro:focus-extrato-search", handleFocus)
    }
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return transactions
    return transactions.filter((item) => {
      const message = item.message.toLowerCase()
      const categoriesText = item.categories
        .map((category) => category.title.toLowerCase())
        .join(" ")
      return message.includes(normalized) || categoriesText.includes(normalized)
    })
  }, [query, transactions])

  const groups = groupByDay(filtered)

  return (
    <div>
      <div className="border-b border-border px-5 py-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Buscar · atalho /
          </span>
          <input
            ref={inputRef}
            id="extrato-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Descrição ou categoria..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent placeholder:text-slate-400 focus:ring-2"
            aria-label="Buscar lançamentos do extrato"
          />
        </label>
      </div>

      <div className="p-3 md:p-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-background px-4 py-12 text-center">
            <p className="font-semibold">Nenhum lançamento encontrado</p>
            <p className="mt-1 text-sm text-muted">
              {transactions.length === 0
                ? "Registre a primeira movimentação deste mês ao lado."
                : "Tente outro filtro, busca ou período."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(([day, items]) => {
              const dayTotal = items.reduce((sum, item) => {
                return item.type === "CREDIT"
                  ? sum + item.value
                  : sum - item.value
              }, 0)

              return (
                <div key={day}>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {day}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        dayTotal >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {dayTotal >= 0 ? "+" : "−"}
                      {formatCurrency(Math.abs(dayTotal))}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {items.map((transaction) => (
                      <EditTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        categories={categories}
                      />
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
