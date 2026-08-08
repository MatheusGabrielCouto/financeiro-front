"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

type PersonalGoalIncrementFormProps = {
  goalId: string
  unit: string
}

export const PersonalGoalIncrementForm = ({
  goalId,
  unit,
}: PersonalGoalIncrementFormProps) => {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const submitAmount = async (value: number) => {
    setError(null)
    if (!Number.isFinite(value) || value === 0) {
      setError("Informe um valor válido")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/personal-goal/${goalId}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível registrar o avanço"
        )
        return
      }

      setAmount("")
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitAmount(Number(amount.replace(",", ".")))
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2" aria-label={`Registrar avanço em ${unit}`}>
      <button
        type="button"
        onClick={() => submitAmount(1)}
        disabled={isLoading}
        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        aria-label={`+1 ${unit}`}
      >
        +1
      </button>
      <input
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder={`+${unit}`}
        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none ring-accent focus:ring-2"
        aria-label={`Valor a somar em ${unit}`}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        Somar
      </button>
      {error ? (
        <span className="text-xs text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </form>
  )
}
