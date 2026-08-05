"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"
import { CategorySearchSelect } from "@/components/category-search-select"
import { PaymentReminderMatchPrompt } from "@/components/payment-reminder-match-prompt"
import {
  matchPaymentReminders,
  type ReminderMatch,
} from "@/lib/payment-reminder-match"
import type { Category, PaymentReminder, TransactionType } from "@/lib/types"

type CreateTransactionFormProps = {
  categories: Category[]
  defaultType?: TransactionType
  lockType?: boolean
  variant?: "card" | "plain"
  submitLabel?: string
  onSuccess?: () => void
  autoFocusDescription?: boolean
  suggestPaymentReminders?: boolean
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
  defaultType = "DEBIT",
  lockType = false,
  variant = "card",
  submitLabel = "Salvar lançamento",
  onSuccess,
  autoFocusDescription = false,
  suggestPaymentReminders = true,
}: CreateTransactionFormProps) => {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [value, setValue] = useState(0)
  const [type, setType] = useState<TransactionType>(defaultType)
  const [categoryId, setCategoryId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [matchPrompt, setMatchPrompt] = useState<{
    matches: ReminderMatch[]
    message: string
    value: number
  } | null>(null)

  useEffect(() => {
    setType(defaultType)
  }, [defaultType])

  const finishSuccess = () => {
    setMessage("")
    setValue(0)
    setCategoryId("")
    setType(defaultType)
    router.refresh()
    onSuccess?.()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (value <= 0) {
      setError("Informe um valor maior que zero")
      return
    }

    setIsLoading(true)
    const snapshot = { message: message.trim(), value, type }

    try {
      const response = await fetch("/api/proxy/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: snapshot.message,
          value: snapshot.value,
          type: snapshot.type,
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

      const canMatch =
        suggestPaymentReminders &&
        (snapshot.type === "DEBIT" || snapshot.type === "PAY")

      if (canMatch) {
        try {
          const remindersResponse = await fetch(
            "/api/proxy/payment-reminder?status=OPEN"
          )
          if (remindersResponse.ok) {
            const reminders =
              (await remindersResponse.json()) as PaymentReminder[]
            const matches = matchPaymentReminders(
              { message: snapshot.message, value: snapshot.value },
              reminders
            )
            if (matches.length > 0) {
              setMessage("")
              setValue(0)
              setCategoryId("")
              setType(defaultType)
              router.refresh()
              setMatchPrompt({
                matches,
                message: snapshot.message,
                value: snapshot.value,
              })
              return
            }
          }
        } catch {
          // matching is best-effort; still finish the create flow
        }
      }

      finishSuccess()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseMatchPrompt = () => {
    setMatchPrompt(null)
    onSuccess?.()
  }

  const handleMarkedDone = () => {
    router.refresh()
  }

  const formClassName =
    variant === "card"
      ? "rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40"
      : "space-y-0"

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={formClassName}
        aria-label="Novo lançamento"
      >
        {variant === "card" ? (
          <div className="mb-5">
            <h2 className="text-base font-semibold">Novo lançamento</h2>
            <p className="mt-1 text-sm text-muted">
              Registre e atualize o saldo da conta.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {!lockType ? (
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
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] opacity-80">
                        {option.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-muted">
              Tipo:{" "}
              <span className="font-semibold text-foreground">
                {typeOptions.find((item) => item.value === type)?.label ?? type}
              </span>
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Descrição</span>
            <input
              required
              autoFocus={autoFocusDescription}
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
            <p
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            aria-label="Salvar lançamento"
          >
            {isLoading ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>

      {matchPrompt ? (
        <PaymentReminderMatchPrompt
          matches={matchPrompt.matches}
          transactionLabel={matchPrompt.message}
          transactionValue={matchPrompt.value}
          onClose={handleCloseMatchPrompt}
          onMarkedDone={handleMarkedDone}
        />
      ) : null}
    </>
  )
}
