"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState, type ComponentType } from "react"
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
  /** Render as a full-width row (icon + label) for use inside a dropdown menu instead of a standalone pill button */
  asMenuItem?: boolean
  icon?: ComponentType<{ className?: string }>
  /** Called after the action completes successfully (e.g. to close a wrapping dropdown menu) */
  onSuccess?: () => void
}

const variantClass = {
  primary:
    "bg-accent text-white hover:brightness-110 border-transparent",
  danger:
    "border-border text-danger hover:bg-red-50 dark:hover:bg-red-950/40",
  ghost:
    "border-border text-foreground hover:bg-background",
}

const menuVariantClass = {
  primary: "text-accent hover:bg-accent-soft",
  danger: "text-danger hover:bg-red-50 dark:hover:bg-red-950/40",
  ghost: "text-foreground hover:bg-slate-50 dark:hover:bg-slate-800",
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
  asMenuItem = false,
  icon: Icon,
  onSuccess,
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
      onSuccess?.()
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
    <div className={asMenuItem ? "" : "space-y-1"}>
      <button
        type="button"
        role={asMenuItem ? "menuitem" : undefined}
        onClick={handleClick}
        disabled={isLoading}
        className={
          asMenuItem
            ? `flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition disabled:opacity-60 ${menuVariantClass[variant]}`
            : `rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${variantClass[variant]}`
        }
        aria-label={ariaLabel}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        {isLoading ? loadingLabel : label}
      </button>
      {error ? (
        <p
          className={`text-xs text-danger ${asMenuItem ? "px-2.5 pb-1" : "max-w-[14rem]"}`}
          role="alert"
        >
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
