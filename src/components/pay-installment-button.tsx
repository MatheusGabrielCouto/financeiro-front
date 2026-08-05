"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type PayInstallmentButtonProps = {
  installmentId: string
  debtTitle: string
}

export const PayInstallmentButton = ({
  installmentId,
  debtTitle,
}: PayInstallmentButtonProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/proxy/installment/${installmentId}`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível pagar a parcela"
        )
        return
      }

      router.refresh()
    } catch {
      setError("Erro de conexão ao pagar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handlePay}
        disabled={isLoading}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        aria-label={`Pagar parcela da dívida ${debtTitle}`}
      >
        {isLoading ? "Pagando..." : "Pagar"}
      </button>
      {error ? (
        <p className="max-w-[12rem] text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
