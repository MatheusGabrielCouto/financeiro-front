import Link from "next/link"
import Image from "next/image"
import { RecipeFavoriteButton } from "@/components/receitas/recipe-favorite-button"
import type { RecipeListItem } from "@/lib/types"
import {
  formatRecipeDuration,
  RECIPE_DIFFICULTY_LABELS,
} from "@/lib/recipe-labels"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"

type RecipeCardProps = {
  recipe: RecipeListItem
}

const DIFFICULTY_STYLES = {
  EASY: "bg-accent-soft/70 text-success",
  MEDIUM: "bg-background text-muted ring-1 ring-border",
  HARD: "bg-danger/10 text-danger",
} as const

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const duration = formatRecipeDuration(recipe.prepMinutes, recipe.cookMinutes)
  const visual = getRecipeCategoryVisual(recipe.category?.color ?? "violet")

  return (
    <article className="interactive-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface">
      <Link
        href={`/pessoal/receitas/${recipe.id}`}
        className="block flex-1"
        aria-label={`Abrir receita ${recipe.title}`}
        tabIndex={0}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {recipe.coverPhotoUrl ? (
            <Image
              src={recipe.coverPhotoUrl}
              alt={recipe.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div
              className={`flex h-full flex-col items-center justify-center bg-gradient-to-br ${visual.placeholder} px-6 text-center`}
            >
              <span className="text-5xl" aria-hidden>
                {recipe.category?.emoji ?? "🍽️"}
              </span>
              {recipe.category ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/70">
                  {recipe.category.name}
                </p>
              ) : null}
            </div>
          )}

          {recipe.category ? (
            <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {recipe.category.emoji} {recipe.category.name}
            </span>
          ) : null}

          <RecipeFavoriteButton
            recipeId={recipe.id}
            isFavorite={recipe.isFavorite}
            variant="card"
            className="absolute right-3 top-3 z-10"
          />

          {recipe.timesCooked > 0 ? (
            <span className="absolute right-3 top-14 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              Feita {recipe.timesCooked}x
            </span>
          ) : null}
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight transition group-hover:text-accent">
              {recipe.isFavorite ? <span className="mr-1 text-amber-500" aria-hidden>★</span> : null}
              {recipe.title}
            </h3>
            {recipe.description ? (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                {recipe.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {duration ? (
              <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-border">
                ⏱ {duration}
              </span>
            ) : null}
            {recipe.servings ? (
              <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-border">
                {recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}
              </span>
            ) : null}
            {recipe.difficulty ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_STYLES[recipe.difficulty]}`}
              >
                {RECIPE_DIFFICULTY_LABELS[recipe.difficulty]}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="mt-auto flex gap-2 border-t border-border/70 p-3">
        <Link
          href={`/pessoal/receitas/${recipe.id}`}
          className="flex-1 rounded-xl border border-border px-3 py-2 text-center text-sm font-semibold transition hover:bg-accent-soft/40"
        >
          Ver receita
        </Link>
        <Link
          href={`/pessoal/receitas/${recipe.id}/preparar`}
          className="flex-1 rounded-xl bg-accent px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Preparar
        </Link>
      </div>
    </article>
  )
}
