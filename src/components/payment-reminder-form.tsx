"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CategorySearchSelect } from "@/components/category-search-select"
import { CurrencyInput } from "@/components/currency-input"
import type { Category, PaymentReminderPriority } from "@/lib/types"

type CreatePaymentReminderFormProps = {
  categories: Category[]
}

const PRIORITIES: Array<{ id: PaymentReminderPriority; label: string }> = [
  { id: "HIGH", label: "Alta" },
  { id: "MEDIUM", label: "Média" },
  { id: "LOW", label: "Baixa" },
]

export const CreatePaymentReminderForm = ({
  categories,
}: CreatePaymentReminderFormProps) => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [value, setValue] = useState(0)
  const [priority, setPriority] = useState<PaymentReminderPriority>("MEDIUM")
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
      const response = await fetch("/api/proxy/payment-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          value,
          priority,
          categoryId: categoryId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar o lembrete"
        )
        return
      }

      setTitle("")
      setNotes("")
      setValue(0)
      setPriority("MEDIUM")
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
      aria-label="Novo item pra pagar"
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium">O que precisa pagar</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Conta do cartão XYZ"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Título do lembrete"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Valor</span>
          <CurrencyInput
            required
            value={value}
            onValueChange={setValue}
            ariaLabel="Valor do lembrete"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Prioridade</span>
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as PaymentReminderPriority)
            }
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Prioridade do lembrete"
          >
            {PRIORITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Observação (opcional)</span>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex.: Pagar quando cair o salário"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Observação do lembrete"
        />
      </label>

      <CategorySearchSelect
        categories={categories}
        value={categoryId}
        onValueChange={setCategoryId}
        ariaLabel="Categoria do lembrete"
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
        {isLoading ? "Salvando..." : "Adicionar à lista"}
      </button>
    </form>
  )
}
