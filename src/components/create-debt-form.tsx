"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { CurrencyInput } from "@/components/currency-input"
import { formatCurrency } from "@/lib/format"
import type {
  InstallmentStatus,
  InterestRateType,
  RecurrenceType,
} from "@/lib/types"

type ManualInstallment = {
  value: number
  status: InstallmentStatus
  date: string
}

type Mode = "manual" | "recurrence"

export const CreateDebtForm = () => {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("recurrence")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [interestRate, setInterestRate] = useState("0")
  const [interestRateType, setInterestRateType] =
    useState<InterestRateType>("MONTHLY")
  const [value, setValue] = useState(0)
  const [installmentsCount, setInstallmentsCount] = useState("12")
  const [recurrence, setRecurrence] = useState<RecurrenceType>("MONTHLY")
  const [dayOfMonth, setDayOfMonth] = useState("10")
  const [dayOfWeek, setDayOfWeek] = useState("1")
  const [month, setMonth] = useState("1")
  const [manualInstallments, setManualInstallments] = useState<ManualInstallment[]>([
    {
      value: 0,
      status: "SCHEDULE",
      date: new Date().toISOString().slice(0, 10),
    },
  ])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const needsDayOfMonth = recurrence === "MONTHLY" || recurrence === "YEARLY"
  const needsDayOfWeek = recurrence === "WEEKLY"
  const needsMonth = recurrence === "YEARLY"

  const totalManual = useMemo(
    () => manualInstallments.reduce((sum, item) => sum + (item.value || 0), 0),
    [manualInstallments]
  )

  const addOneMonth = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) {
      return new Date().toISOString().slice(0, 10)
    }

    const nextMonthIndex = month // 1-based month -> next month as 0-based Date month
    const lastDayOfNextMonth = new Date(year, nextMonthIndex + 1, 0).getDate()
    const safeDay = Math.min(day, lastDayOfNextMonth)
    const next = new Date(year, nextMonthIndex, safeDay)
    const yyyy = next.getFullYear()
    const mm = String(next.getMonth() + 1).padStart(2, "0")
    const dd = String(next.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const handleAddInstallment = () => {
    setManualInstallments((prev) => {
      const last = prev[prev.length - 1]
      return [
        ...prev,
        {
          value: last?.value ?? 0,
          status: "SCHEDULE",
          date: last
            ? addOneMonth(last.date)
            : new Date().toISOString().slice(0, 10),
        },
      ]
    })
  }

  const handleRemoveInstallment = (index: number) => {
    setManualInstallments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const interest = Number(interestRate) || 0
      let response: Response

      if (mode === "recurrence") {
        if (value <= 0) {
          setError("Informe um valor de parcela maior que zero")
          return
        }

        setIsLoading(true)
        response = await fetch("/api/proxy/debt/recurrence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: description || null,
            interestRate: interest,
            interestRateType,
            value,
            installmentsCount: Number(installmentsCount),
            recurrence,
            ...(needsDayOfMonth ? { dayOfMonth } : {}),
            ...(needsDayOfWeek ? { dayOfWeek: Number(dayOfWeek) } : {}),
            ...(needsMonth ? { month: Number(month) } : {}),
          }),
        })
      } else {
        if (manualInstallments.length === 0) {
          setError("Adicione ao menos uma parcela")
          return
        }

        if (manualInstallments.some((item) => item.value <= 0)) {
          setError("Todas as parcelas precisam ter valor maior que zero")
          return
        }

        setIsLoading(true)
        response = await fetch("/api/proxy/debt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: description || null,
            interestRate: interest,
            interestRateType,
            installments: manualInstallments.map((item) => ({
              value: item.value,
              status: item.status,
              date: new Date(item.date).toISOString(),
            })),
          }),
        })
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar a dívida"
        )
        return
      }

      router.replace("/dividas")
      router.refresh()
    } catch {
      setError("Erro de conexão ao criar dívida")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6"
      aria-label="Formulário de nova dívida"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("recurrence")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "recurrence"
              ? "bg-accent text-white"
              : "border border-border bg-background text-foreground"
          }`}
          aria-pressed={mode === "recurrence"}
        >
          Recorrência
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "manual"
              ? "bg-accent text-white"
              : "border border-border bg-background text-foreground"
          }`}
          aria-pressed={mode === "manual"}
        >
          Parcelas manuais
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Título</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Título da dívida"
          />
        </label>

        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Descrição</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Descrição da dívida"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Taxa de juros (%)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={interestRate}
            onChange={(event) => setInterestRate(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Taxa de juros"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Tipo da taxa</span>
          <select
            value={interestRateType}
            onChange={(event) =>
              setInterestRateType(event.target.value as InterestRateType)
            }
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Tipo da taxa de juros"
          >
            <option value="MONTHLY">Ao mês</option>
            <option value="DAILY">Ao dia</option>
          </select>
        </label>
      </div>

      {mode === "recurrence" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Valor da parcela</span>
            <CurrencyInput
              required
              value={value}
              onValueChange={setValue}
              ariaLabel="Valor da parcela"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Quantidade de parcelas</span>
            <input
              required
              type="number"
              min={1}
              value={installmentsCount}
              onChange={(event) => setInstallmentsCount(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
              aria-label="Quantidade de parcelas"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Recorrência</span>
            <select
              value={recurrence}
              onChange={(event) =>
                setRecurrence(event.target.value as RecurrenceType)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
              aria-label="Tipo de recorrência"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="WEEKLY">Semanal</option>
              <option value="DAILY">Diária</option>
              <option value="YEARLY">Anual</option>
            </select>
          </label>

          {needsDayOfMonth ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Dia do mês</span>
              <input
                required
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(event) => setDayOfMonth(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                aria-label="Dia do mês"
              />
            </label>
          ) : null}

          {needsDayOfWeek ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Dia da semana</span>
              <select
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                aria-label="Dia da semana"
              >
                <option value="0">Domingo</option>
                <option value="1">Segunda</option>
                <option value="2">Terça</option>
                <option value="3">Quarta</option>
                <option value="4">Quinta</option>
                <option value="5">Sexta</option>
                <option value="6">Sábado</option>
              </select>
            </label>
          ) : null}

          {needsMonth ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Mês</span>
              <input
                required
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                aria-label="Mês do ano"
              />
            </label>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Parcelas manuais · total {formatCurrency(totalManual)}
            </p>
            <button
              type="button"
              onClick={handleAddInstallment}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
              aria-label="Adicionar parcela"
            >
              Adicionar parcela
            </button>
          </div>

          <div className="space-y-3">
            {manualInstallments.map((item, index) => (
              <div
                key={`installment-${index}`}
                className="grid gap-3 rounded-2xl border border-border bg-background p-3 md:grid-cols-[1fr_1fr_auto_auto]"
              >
                <label className="block space-y-1">
                  <span className="text-xs text-muted">Valor</span>
                  <CurrencyInput
                    required
                    value={item.value}
                    onValueChange={(nextValue) =>
                      setManualInstallments((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, value: nextValue } : row
                        )
                      )
                    }
                    ariaLabel={`Valor da parcela ${index + 1}`}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-muted">Data</span>
                  <input
                    required
                    type="date"
                    value={item.date}
                    onChange={(event) =>
                      setManualInstallments((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, date: event.target.value } : row
                        )
                      )
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                    aria-label={`Data da parcela ${index + 1}`}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-muted">Status</span>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      setManualInstallments((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                status: event.target.value as InstallmentStatus,
                              }
                            : row
                        )
                      )
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                    aria-label={`Status da parcela ${index + 1}`}
                  >
                    <option value="SCHEDULE">Agendada</option>
                    <option value="PAY">Paga</option>
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveInstallment(index)}
                    disabled={manualInstallments.length === 1}
                    className="rounded-lg border border-border px-3 py-2 text-xs text-danger disabled:opacity-40"
                    aria-label={`Remover parcela ${index + 1}`}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          aria-label="Salvar dívida"
        >
          {isLoading ? "Salvando..." : "Salvar dívida"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dividas")}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-background"
          aria-label="Cancelar e voltar"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
