"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { RecipeCategory } from "@/lib/types"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"

type RecipeCategoryChipsProps = {
  categories: RecipeCategory[]
  activeCategoryId?: string
  favoritesOnly?: boolean
  uncategorized?: boolean
  totalCount: number
  favoriteCount: number
}

export const RecipeCategoryChips = ({
  categories,
  activeCategoryId,
  favoritesOnly = false,
  uncategorized = false,
  totalCount,
  favoriteCount,
}: RecipeCategoryChipsProps) => {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q")

  const buildHref = (options?: { categoryId?: string; favorites?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (options?.categoryId) {
      params.set("categoryId", options.categoryId)
      params.delete("favorites")
      params.delete("uncategorized")
    } else     if (options?.categoryId === undefined && options?.favorites === undefined) {
      params.delete("categoryId")
      params.delete("favorites")
      params.delete("uncategorized")
    }

    if (options?.favorites) {
      params.set("favorites", "1")
      params.delete("categoryId")
      params.delete("uncategorized")
    } else if (options?.favorites === false) {
      params.delete("favorites")
    }

    const query = params.toString()
    return query ? `/pessoal/receitas?${query}` : "/pessoal/receitas"
  }

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
  const allActive = !activeCategoryId && !favoritesOnly && !uncategorized

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filtrar receitas"
    >
      <Link
        href={buildHref()}
        role="tab"
        aria-selected={allActive}
        className={`interactive-lift shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          allActive
            ? "border-accent bg-accent text-white"
            : "border-border bg-background text-foreground hover:bg-accent-soft/40"
        }`}
      >
        Todas
        <span className="ml-1.5 opacity-80">({totalCount})</span>
      </Link>

      <Link
        href={buildHref({ favorites: true })}
        role="tab"
        aria-selected={favoritesOnly}
        className={`interactive-lift shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          favoritesOnly
            ? "border-amber-400 bg-amber-500 text-white"
            : "border-border bg-background text-foreground hover:bg-accent-soft/40"
        }`}
      >
        <span aria-hidden>★</span> Favoritas
        <span className="ml-1.5 opacity-80">({favoriteCount})</span>
      </Link>

      {sorted.map((category) => {
        const visual = getRecipeCategoryVisual(category.color)
        const isActive = activeCategoryId === category.id && !favoritesOnly

        return (
          <Link
            key={category.id}
            href={buildHref({ categoryId: category.id })}
            role="tab"
            aria-selected={isActive}
            className={`interactive-lift shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive ? visual.chipActive : visual.chip
            }`}
          >
            <span aria-hidden>{category.emoji}</span> {category.name}
            <span className="ml-1.5 opacity-80">({category.recipeCount})</span>
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
