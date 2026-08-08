"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type MonthsFilterProps = {
  months: number
}

const OPTIONS = [3, 6, 12, 24]

export const MonthsFilter = ({ months }: MonthsFilterProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState(months)

  useEffect(() => {
    setSelected(months)
  }, [months])

  const handleSelect = (value: number) => {
    setSelected(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("months", String(value))
    router.push(`/relatorios?${params.toString()}`)
  }

  return (
    <div
      className="inline-flex rounded-xl border border-border bg-slate-50 p-1 shadow-sm shadow-slate-200/40 dark:bg-slate-900/50"
      role="group"
      aria-label="Período do relatório"
    >
      {OPTIONS.map((value) => {
        const isActive = selected === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              isActive
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
            aria-pressed={isActive}
            aria-label={`Últimos ${value} meses`}
          >
            {value}m
          </button>
        )
      })}
    </div>
  )
}
