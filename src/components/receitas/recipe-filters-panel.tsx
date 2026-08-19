"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react"
import { IconChevron } from "@/components/icons"
import { RecipeAdvancedFilters } from "@/components/receitas/recipe-advanced-filters"
import { RecipeCategoryChips } from "@/components/receitas/recipe-category-chips"
import {
  countActiveRecipeFilters,
  getActiveRecipeFilterChips,
  hasRecipeAdvancedFilters,
  type RecipeFilterState,
} from "@/lib/recipe-filters"
import type { RecipeCategory } from "@/lib/types"

const STORAGE_KEY = "recipe-filters-expanded"

type RecipeFiltersPanelProps = {
  categories: RecipeCategory[]
  activeCategoryId?: string
  favoritesOnly: boolean
  uncategorized: boolean
  activeCategoryName?: string | null
  filters: RecipeFilterState
  counts: {
    difficulty: Record<"EASY" | "MEDIUM" | "HARD", number>
    maxTime: Record<"15" | "30" | "60", number>
    cooked: Record<"1" | "0", number>
    uncategorized: number
  }
  totalCount: number
  favoriteCount: number
  searchQuery?: string
}

export const RecipeFiltersPanel = ({
  categories,
  activeCategoryId,
  favoritesOnly,
  uncategorized,
  activeCategoryName,
  filters,
  counts,
  totalCount,
  favoriteCount,
  searchQuery,
}: RecipeFiltersPanelProps) => {
  const panelId = useId()
  const searchParams = useSearchParams()
  const filterParams = {
    categoryId: activeCategoryId,
    uncategorized: uncategorized ? "1" : undefined,
    difficulty: filters.difficulty === "all" ? undefined : filters.difficulty,
    maxTime: filters.maxTime === "all" ? undefined : filters.maxTime,
    cooked: filters.cooked === "all" ? undefined : filters.cooked,
    sort: filters.sort === "recent" ? undefined : filters.sort,
  }
  const activeChips = getActiveRecipeFilterChips(
    filterParams,
    favoritesOnly,
    filters,
    activeCategoryName
  )
  const activeFilterCount = countActiveRecipeFilters(
    filterParams,
    favoritesOnly,
    filters,
    activeCategoryName
  )
  const hasAdvanced = hasRecipeAdvancedFilters(filters)

  const clearAdvancedHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("difficulty")
    params.delete("maxTime")
    params.delete("cooked")
    params.delete("uncategorized")
    params.delete("sort")
    const query = params.toString()
    return query ? `/pessoal/receitas?${query}` : "/pessoal/receitas"
  }, [searchParams])

  const [expanded, setExpanded] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "true" || stored === "false") {
      setExpanded(stored === "true")
      return
    }
    setExpanded(activeFilterCount > 0)
  }, [activeFilterCount])

  const handleToggle = () => {
    setExpanded((current) => {
      const next = !current
      window.localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/40">
      <div className="flex flex-wrap items-center gap-3 px-3 py-3 md:px-4">
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="inline-flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-accent-soft/30"
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background transition ${
              expanded ? "bg-accent-soft/40" : ""
            }`}
          >
            <IconChevron
              className={`h-4 w-4 text-muted transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}
            />
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-semibold">Filtros</span>
            <span className="block text-xs text-muted">
              {expanded
                ? "Coleções, dificuldade, tempo e ordenação"
                : activeFilterCount > 0
                  ? `${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} ativo${activeFilterCount === 1 ? "" : "s"}`
                  : "Minimizado · clique para expandir"}
            </span>
          </span>

          {activeFilterCount > 0 ? (
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>

        <div className="flex items-center gap-2">
          {hasAdvanced && hydrated && !expanded ? (
            <Link
              href={clearAdvancedHref}
              className="text-sm font-semibold text-accent hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Limpar avançados
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleToggle}
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold transition hover:bg-accent-soft/40"
            aria-label={expanded ? "Minimizar filtros" : "Maximizar filtros"}
          >
            {expanded ? "Minimizar" : "Maximizar"}
          </button>
        </div>
      </div>

      {!expanded && activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-border/60 px-3 py-3 md:px-4">
          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className="rounded-full border border-accent/30 bg-accent-soft/40 px-3 py-1 text-xs font-semibold text-accent"
            >
              {chip.label}
            </span>
          ))}
          {searchQuery ? (
            <span className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted">
              Busca: “{searchQuery}”
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        id={panelId}
        hidden={!expanded}
        className={`border-t border-border/60 ${expanded ? "block" : "hidden"}`}
      >
        <div className="space-y-4 p-3 md:p-4">
          <RecipeCategoryChips
            categories={categories}
            activeCategoryId={activeCategoryId}
            favoritesOnly={favoritesOnly}
            uncategorized={uncategorized}
            totalCount={totalCount}
            favoriteCount={favoriteCount}
          />

          <RecipeAdvancedFilters
            activeDifficulty={filters.difficulty}
            activeMaxTime={filters.maxTime}
            activeCooked={filters.cooked}
            uncategorized={uncategorized}
            activeSort={filters.sort}
            counts={counts}
          />
        </div>
      </div>
    </div>
  )
}
