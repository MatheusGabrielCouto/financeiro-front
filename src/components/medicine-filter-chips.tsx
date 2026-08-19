"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export type MedicineFilter = "all" | "attention" | "expired" | "expiring" | "low" | "ok"

type MedicineFilterChipsProps = {
  activeFilter: MedicineFilter
  counts: {
    all: number
    attention: number
    expired: number
    expiring: number
    low: number
    ok: number
  }
}

const FILTERS: { id: MedicineFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "attention", label: "Precisam de atenção" },
  { id: "expired", label: "Vencidos" },
  { id: "expiring", label: "Vencendo" },
  { id: "low", label: "Estoque baixo" },
  { id: "ok", label: "Em dia" },
]

export const MedicineFilterChips = ({ activeFilter, counts }: MedicineFilterChipsProps) => {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q")

  const buildHref = (filter: MedicineFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === "all") {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    const query = params.toString()
    return query ? `/pessoal/remedios?${query}` : "/pessoal/remedios"
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filtrar remédios"
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id
        const count = counts[filter.id === "expiring" ? "expiring" : filter.id]

        return (
          <Link
            key={filter.id}
            href={buildHref(filter.id)}
            role="tab"
            aria-selected={isActive}
            className={`interactive-lift shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? filter.id === "attention" || filter.id === "expired"
                  ? "border-danger bg-danger text-white"
                  : filter.id === "expiring"
                    ? "border-warning bg-warning text-white"
                    : "border-accent bg-accent text-white"
                : "border-border bg-background text-foreground hover:bg-accent-soft/40"
            }`}
          >
            {filter.label}
            <span className="ml-1.5 opacity-80">({count})</span>
          </Link>
        )
      })}

      {searchQuery ? (
        <span className="flex shrink-0 items-center rounded-full border border-dashed border-border px-4 py-2 text-xs text-muted">
          Buscando: “{searchQuery}”
        </span>
      ) : null}
    </div>
  )
}
