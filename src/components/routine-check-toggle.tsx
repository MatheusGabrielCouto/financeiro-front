"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { IconCheck } from "@/components/icons"
import { getRoutineColor } from "@/lib/routine-colors"

type RoutineCheckToggleProps = {
  id: string
  date: string
  checked: boolean
  color: string
  ariaLabel: string
}

export const RoutineCheckToggle = ({
  id,
  date,
  checked,
  color,
  ariaLabel,
}: RoutineCheckToggleProps) => {
  const router = useRouter()
  const [optimistic, setOptimistic] = useState(checked)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(false)
  const palette = getRoutineColor(color)

  const handleClick = async () => {
    if (isPending) return
    const next = !optimistic
    setOptimistic(next)
    setError(false)
    setIsPending(true)

    try {
      const response = await fetch(
        `/api/proxy/routine/${id}/check-in${next ? "" : `?date=${date}`}`,
        { method: next ? "POST" : "DELETE" }
      )
      if (!response.ok) throw new Error("failed")
      router.refresh()
    } catch {
      setOptimistic(!next)
      setError(true)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={optimistic}
        aria-label={ariaLabel}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out disabled:opacity-70 ${
          optimistic
            ? `bg-gradient-to-br ${palette.from} ${palette.to} scale-100 shadow-md shadow-slate-900/10`
            : `scale-95 border-2 ${palette.border} bg-surface hover:scale-100 hover:bg-background`
        }`}
      >
        <IconCheck
          className={`h-5 w-5 transition-all duration-200 ${
            optimistic
              ? "scale-100 text-white opacity-100"
              : "scale-75 text-transparent opacity-0"
          }`}
        />
      </button>
      {error ? (
        <span className="text-[10px] font-medium text-danger" role="alert">
          Erro
        </span>
      ) : null}
    </div>
  )
}
