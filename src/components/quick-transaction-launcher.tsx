"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { CreateTransactionForm } from "@/components/create-transaction-form"
import { IconClose, IconPlus, IconTransactions } from "@/components/icons"
import type { Category, TransactionType } from "@/lib/types"

type QuickMode = "CREDIT" | "DEBIT" | "ANY"

type QuickTransactionLauncherProps = {
  categories: Category[]
  variant?: "toolbar" | "hero" | "fab" | "shortcut"
  className?: string
}

const modeTitle: Record<QuickMode, string> = {
  CREDIT: "Nova entrada",
  DEBIT: "Nova saída",
  ANY: "Novo lançamento",
}

export const QuickTransactionLauncher = ({
  categories,
  variant = "toolbar",
  className = "",
}: QuickTransactionLauncherProps) => {
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<QuickMode>("ANY")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (variant !== "shortcut") return

    const handleOpenEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: QuickMode }>).detail
      setMode(detail?.mode ?? "DEBIT")
      setOpen(true)
    }

    window.addEventListener("financeiro:quick-transaction", handleOpenEvent)
    return () => {
      window.removeEventListener("financeiro:quick-transaction", handleOpenEvent)
    }
  }, [variant])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const handleOpen = (next: QuickMode) => {
    setMode(next)
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  const defaultType: TransactionType =
    mode === "CREDIT" ? "CREDIT" : mode === "DEBIT" ? "DEBIT" : "DEBIT"

  const buttonBase =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition"

  const toolbar = (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => handleOpen("CREDIT")}
        className={`${buttonBase} border border-emerald-200 bg-emerald-50 text-success hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40`}
        aria-label="Registrar entrada rápida"
      >
        + Entrada
      </button>
      <button
        type="button"
        onClick={() => handleOpen("DEBIT")}
        className={`${buttonBase} border border-amber-200 bg-amber-50 text-warning hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:hover:bg-amber-900/40`}
        aria-label="Registrar saída rápida"
      >
        + Saída
      </button>
      {variant === "toolbar" ? (
        <button
          type="button"
          onClick={() => handleOpen("ANY")}
          className={`${buttonBase} border border-border bg-surface text-foreground hover:bg-slate-50 dark:hover:bg-slate-800`}
          aria-label="Novo lançamento"
        >
          <IconPlus className="h-4 w-4" />
          Lançamento
        </button>
      ) : null}
    </div>
  )

  const hero = (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => handleOpen("CREDIT")}
        className={`${buttonBase} bg-white text-slate-900 hover:bg-teal-50`}
        aria-label="Registrar entrada rápida"
      >
        <IconPlus className="h-4 w-4" />
        Entrada
      </button>
      <button
        type="button"
        onClick={() => handleOpen("DEBIT")}
        className={`${buttonBase} border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15`}
        aria-label="Registrar saída rápida"
      >
        <IconTransactions className="h-4 w-4" />
        Saída
      </button>
    </div>
  )

  const fab = (
    <div
      className={`fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 md:hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => handleOpen("CREDIT")}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-success shadow-lg shadow-slate-900/10 dark:border-emerald-900/40 dark:bg-emerald-950/40"
        aria-label="Entrada rápida"
      >
        + Entrada
      </button>
      <button
        type="button"
        onClick={() => handleOpen("DEBIT")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-teal-900/20"
        aria-label="Saída rápida"
      >
        <IconPlus className="h-6 w-6" />
      </button>
    </div>
  )

  return (
    <>
      {variant === "shortcut"
        ? null
        : variant === "hero"
          ? hero
          : variant === "fab"
            ? fab
            : toolbar}

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                aria-label="Fechar lançamento rápido"
                onClick={handleClose}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl shadow-slate-900/15 sm:rounded-2xl md:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id={titleId}
                      className="font-[family-name:var(--font-display)] text-xl font-semibold"
                    >
                      {modeTitle[mode]}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Atualiza o saldo na hora.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-border p-2 text-muted transition hover:bg-slate-50 hover:text-foreground dark:hover:bg-slate-800"
                    aria-label="Fechar"
                  >
                    <IconClose className="h-4 w-4" />
                  </button>
                </div>

                <CreateTransactionForm
                  categories={categories}
                  defaultType={defaultType}
                  lockType={mode !== "ANY"}
                  variant="plain"
                  submitLabel={
                    mode === "CREDIT"
                      ? "Salvar entrada"
                      : mode === "DEBIT"
                        ? "Salvar saída"
                        : "Salvar lançamento"
                  }
                  autoFocusDescription
                  onSuccess={handleClose}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
