"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"

type ProxyActionButtonProps = {
  path: string
  method?: "POST" | "PATCH" | "DELETE" | "PUT"
  label: string
  loadingLabel?: string
  confirmMessage?: string
  confirmTitle?: string
  variant?: "primary" | "danger" | "ghost"
  ariaLabel: string
  body?: unknown
  redirectTo?: string
}

const variantClass = {
  primary:
    "bg-accent text-white hover:brightness-110 border-transparent",
  danger:
    "border-border text-danger hover:bg-red-50",
  ghost:
    "border-border text-foreground hover:bg-background",
}

export const ProxyActionButton = ({
  path,
  method = "POST",
  label,
  loadingLabel = "Aguarde...",
  confirmMessage,
  confirmTitle = "Excluir",
  variant = "ghost",
  ariaLabel,
  body,
  redirectTo,
}: ProxyActionButtonProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleCancel = useCallback(() => {
    if (isLoading) return
    setIsConfirmOpen(false)
  }, [isLoading])

  const runAction = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/proxy${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível concluir a ação"
        )
        setIsConfirmOpen(false)
        return
      }

      setIsConfirmOpen(false)
      if (redirectTo) {
        router.push(redirectTo)
        router.refresh()
        return
      }
      router.refresh()
    } catch {
      setError("Erro de conexão")
      setIsConfirmOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = () => {
    if (confirmMessage) {
      setIsConfirmOpen(true)
      return
    }

    void runAction()
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${variantClass[variant]}`}
        aria-label={ariaLabel}
      >
        {isLoading ? loadingLabel : label}
      </button>
      {error ? (
        <p className="max-w-[14rem] text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {confirmMessage ? (
        <ConfirmDialog
          open={isConfirmOpen}
          title={confirmTitle}
          description={confirmMessage}
          confirmLabel={label}
          loadingLabel={loadingLabel}
          isLoading={isLoading}
          onCancel={handleCancel}
          onConfirm={() => void runAction()}
        />
      ) : null}
    </div>
  )
}
