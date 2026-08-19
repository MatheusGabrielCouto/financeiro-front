"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { RECIPE_DIFFICULTY_LABELS } from "@/lib/recipe-labels"
import {
  hasRecipeAdvancedFilters,
  type RecipeCookedFilter,
  type RecipeDifficultyFilter,
  type RecipeMaxTimeFilter,
  type RecipeSort,
} from "@/lib/recipe-filters"

type RecipeAdvancedFiltersProps = {
  activeDifficulty: RecipeDifficultyFilter
  activeMaxTime: RecipeMaxTimeFilter
  activeCooked: RecipeCookedFilter
  uncategorized: boolean
  activeSort: RecipeSort
  counts: {
    difficulty: Record<"EASY" | "MEDIUM" | "HARD", number>
    maxTime: Record<"15" | "30" | "60", number>
    cooked: Record<"1" | "0", number>
    uncategorized: number
  }
}

const chipClass = (active: boolean) =>
  `interactive-lift shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
    active
      ? "border-accent bg-accent text-white"
      : "border-border bg-background text-foreground hover:bg-accent-soft/40"
  }`

const sectionLabelClass = "shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted"

export const RecipeAdvancedFilters = ({
  activeDifficulty,
  activeMaxTime,
  activeCooked,
  uncategorized,
  activeSort,
  counts,
}: RecipeAdvancedFiltersProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const buildHref = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
        return
      }
      params.set(key, value)
    })

    if (updates.uncategorized === "1") {
      params.delete("categoryId")
      params.delete("favorites")
    }

    const query = params.toString()
    return query ? `/pessoal/receitas?${query}` : "/pessoal/receitas"
  }

  const handleSortChange = (value: RecipeSort) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "recent") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    router.push(params.toString() ? `/pessoal/receitas?${params.toString()}` : "/pessoal/receitas")
  }

  const hasActiveAdvanced = hasRecipeAdvancedFilters({
    difficulty: activeDifficulty,
    maxTime: activeMaxTime,
    cooked: activeCooked,
    uncategorized,
    sort: activeSort,
  })

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/30 p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Refinar resultados
        </p>
        {hasActiveAdvanced ? (
          <Link
            href={buildHref({
              difficulty: null,
              maxTime: null,
              cooked: null,
              uncategorized: null,
              sort: null,
            })}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Limpar avançados
          </Link>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={sectionLabelClass}>Dificuldade</span>
          <Link
            href={buildHref({ difficulty: null })}
            aria-selected={activeDifficulty === "all"}
            className={chipClass(activeDifficulty === "all")}
          >
            Todas
          </Link>
          {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
            <Link
              key={level}
              href={buildHref({
                difficulty: activeDifficulty === level ? null : level,
              })}
              aria-selected={activeDifficulty === level}
              className={chipClass(activeDifficulty === level)}
            >
              {RECIPE_DIFFICULTY_LABELS[level]}
              <span className="ml-1.5 opacity-80">({counts.difficulty[level]})</span>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={sectionLabelClass}>Tempo</span>
          <Link
            href={buildHref({ maxTime: null })}
            aria-selected={activeMaxTime === "all"}
            className={chipClass(activeMaxTime === "all")}
          >
            Qualquer
          </Link>
          {(
            [
              { id: "15" as const, label: "Até 15 min" },
              { id: "30" as const, label: "Até 30 min" },
              { id: "60" as const, label: "Até 1 h" },
            ] as const
          ).map((option) => (
            <Link
              key={option.id}
              href={buildHref({
                maxTime: activeMaxTime === option.id ? null : option.id,
              })}
              aria-selected={activeMaxTime === option.id}
              className={chipClass(activeMaxTime === option.id)}
            >
              {option.label}
              <span className="ml-1.5 opacity-80">({counts.maxTime[option.id]})</span>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={sectionLabelClass}>Preparo</span>
          <Link
            href={buildHref({ cooked: null })}
            aria-selected={activeCooked === "all"}
            className={chipClass(activeCooked === "all")}
          >
            Todas
          </Link>
          <Link
            href={buildHref({ cooked: activeCooked === "1" ? null : "1" })}
            aria-selected={activeCooked === "1"}
            className={chipClass(activeCooked === "1")}
          >
            Já preparei
            <span className="ml-1.5 opacity-80">({counts.cooked["1"]})</span>
          </Link>
          <Link
            href={buildHref({ cooked: activeCooked === "0" ? null : "0" })}
            aria-selected={activeCooked === "0"}
            className={chipClass(activeCooked === "0")}
          >
            Nunca fiz
            <span className="ml-1.5 opacity-80">({counts.cooked["0"]})</span>
          </Link>
          <Link
            href={buildHref({
              uncategorized: uncategorized ? null : "1",
            })}
            aria-selected={uncategorized}
            className={chipClass(uncategorized)}
          >
            Sem coleção
            <span className="ml-1.5 opacity-80">({counts.uncategorized})</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={sectionLabelClass}>Ordenar</span>
          <label className="sr-only" htmlFor="recipe-sort">
            Ordenar receitas
          </label>
          <select
            id="recipe-sort"
            value={activeSort}
            onChange={(event) => handleSortChange(event.target.value as RecipeSort)}
            className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-semibold outline-none ring-accent transition focus:ring-2"
          >
            <option value="recent">Mais recentes</option>
            <option value="title">A–Z</option>
            <option value="cooked">Mais preparadas</option>
            <option value="quick">Mais rápidas</option>
          </select>
        </div>
      </div>
    </div>
  )
}
