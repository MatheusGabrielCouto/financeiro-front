"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { formatCurrency } from "@/lib/format"
import type { ReminderMatch } from "@/lib/payment-reminder-match"

type PaymentReminderMatchPromptProps = {
  matches: ReminderMatch[]
  transactionLabel: string
  transactionValue: number
  onClose: () => void
  onMarkedDone: (reminderId: string) => void
}

export const PaymentReminderMatchPrompt = ({
  matches,
  transactionLabel,
  transactionValue,
  onClose,
  onMarkedDone,
}: PaymentReminderMatchPromptProps) => {
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(matches)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setRemaining(matches)
  }, [matches])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  const handleMarkDone = async (reminderId: string) => {
    setPendingId(reminderId)
    setError(null)

    try {
      const response = await fetch(
        `/api/proxy/payment-reminder/${reminderId}/done`,
        { method: "POST" }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível marcar como feito"
        )
        return
      }

      onMarkedDone(reminderId)
      const next = remaining.filter((item) => item.reminder.id !== reminderId)
      setRemaining(next)
      if (next.length === 0) onClose()
    } catch {
      setError("Erro de conexão")
    } finally {
      setPendingId(null)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-slate-900/20"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Conciliar
        </p>
        <h2 id={titleId} className="mt-1 text-lg font-semibold">
          Isso quitou algum item de Pra pagar?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Lançamento{" "}
          <span className="font-medium text-foreground">
            {transactionLabel || "sem descrição"}
          </span>{" "}
          de {formatCurrency(transactionValue)}. Marcar como feito não altera o
          saldo de novo.
        </p>

        <ul className="mt-4 space-y-2">
          {remaining.map(({ reminder, reasons }) => (
            <li
              key={reminder.id}
              className="rounded-xl border border-border/80 bg-background/70 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{reminder.title}</p>
                  <p className="mt-0.5 text-sm tabular-nums text-muted">
                    {formatCurrency(reminder.value)}
                  </p>
                  {reasons.length > 0 ? (
                    <p className="mt-1 text-[11px] text-muted">
                      {reasons.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkDone(reminder.id)}
                  disabled={pendingId === reminder.id}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
                  aria-label={`Marcar ${reminder.title} como feito`}
                >
                  {pendingId === reminder.id ? "..." : "Sim, feito"}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Ignorar sugestões de conciliação"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
