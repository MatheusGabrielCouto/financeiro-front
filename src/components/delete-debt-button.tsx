"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"

type DeleteDebtButtonProps = {
  debtId: string
  debtTitle: string
  redirectTo?: string
}

export const DeleteDebtButton = ({
  debtId,
  debtTitle,
  redirectTo,
}: DeleteDebtButtonProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleCancel = useCallback(() => {
    if (isLoading) return
    setIsConfirmOpen(false)
  }, [isLoading])

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/proxy/debt/${debtId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível excluir a dívida"
        )
        setIsConfirmOpen(false)
        return
      }

      setIsConfirmOpen(false)

      if (redirectTo) {
        router.replace(redirectTo)
        router.refresh()
        return
      }

      router.refresh()
    } catch {
      setError("Erro de conexão ao excluir")
      setIsConfirmOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isLoading}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-red-50 disabled:opacity-60"
        aria-label={`Excluir dívida ${debtTitle}`}
      >
        {isLoading ? "Excluindo..." : "Excluir"}
      </button>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={isConfirmOpen}
        title="Excluir dívida"
        description={`Você está prestes a excluir "${debtTitle}". Esta ação não pode ser desfeita.`}
        isLoading={isLoading}
        onCancel={handleCancel}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
