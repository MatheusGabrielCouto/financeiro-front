"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { IconClose } from "@/components/icons"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  loadingLabel = "Excluindo...",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const titleId = useId()
  const descriptionId = useId()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, isLoading, onCancel])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Fechar confirmação"
        onClick={() => {
          if (!isLoading) onCancel()
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-slate-900/15 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p id={descriptionId} className="mt-1.5 text-sm text-muted">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-border p-2 text-muted transition hover:bg-slate-50 hover:text-foreground disabled:opacity-60"
            aria-label="Fechar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
