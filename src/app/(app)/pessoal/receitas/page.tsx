import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { IconImport, IconPlus, IconRecipe } from "@/components/icons"
import { RecipeCard } from "@/components/receitas/recipe-card"
import { RecipeCategoryManager } from "@/components/receitas/recipe-category-manager"
import { RecipeExportButton } from "@/components/receitas/recipe-export-dialog"
import { RecipeFiltersPanel } from "@/components/receitas/recipe-filters-panel"
import { RecipeGroupedList } from "@/components/receitas/recipe-grouped-list"
import { RecipeSearch } from "@/components/receitas/recipe-search"
import { ApiError } from "@/lib/api-server"
import { getRecipeCategories, getRecipes } from "@/lib/finance-api"
import type { RecipeListItem } from "@/lib/types"
import {
  buildRecipeApiParams,
  getRecipeExportScopeLabel,
  getRecipeFilterCounts,
  hasRecipeListFilters,
  parseRecipeFilters,
} from "@/lib/recipe-filters"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"

type ReceitasPageProps = {
  searchParams: Promise<{
    categoryId?: string
    q?: string
    favorites?: string
    difficulty?: string
    maxTime?: string
    cooked?: string
    uncategorized?: string
    sort?: string
  }>
}

const RecipeToolbarFallback = () => (
  <div className="panel space-y-4 p-4">
    <div className="h-12 animate-pulse rounded-2xl bg-accent-soft/30" />
    <div className="flex gap-2">
      <div className="h-10 w-24 animate-pulse rounded-full bg-accent-soft/30" />
      <div className="h-10 w-36 animate-pulse rounded-full bg-accent-soft/30" />
      <div className="h-10 w-32 animate-pulse rounded-full bg-accent-soft/30" />
    </div>
  </div>
)

const RecentlyCookedStrip = ({ recipes }: { recipes: RecipeListItem[] }) => {
  const recent = [...recipes]
    .filter((recipe) => recipe.timesCooked > 0)
    .sort((a, b) => b.timesCooked - a.timesCooked || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)

  if (recent.length === 0) return null

  return (
    <section className="panel p-5" aria-labelledby="recent-recipes-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Continue de onde parou
          </p>
          <h2
            id="recent-recipes-heading"
            className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
          >
            Preparadas recentemente
          </h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {recent.map((recipe) => {
          const visual = getRecipeCategoryVisual(recipe.category?.color ?? "violet")

          return (
          <Link
            key={recipe.id}
            href={`/pessoal/receitas/${recipe.id}/preparar`}
            className="interactive-lift panel-soft flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${visual.iconBg}`}
            >
              {recipe.category?.emoji ?? "🍽️"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{recipe.title}</span>
              <span className="text-xs text-muted">Feita {recipe.timesCooked}x · Preparar de novo</span>
            </span>
          </Link>
          )
        })}
      </div>
    </section>
  )
}

const ReceitasPage = async ({ searchParams }: ReceitasPageProps) => {
  const params = await searchParams
  const favoritesOnly = params.favorites === "1"
  const filters = parseRecipeFilters(params)
  const apiParams = buildRecipeApiParams(params, favoritesOnly)
  const hasFilters = hasRecipeListFilters(params, favoritesOnly)

  try {
    const [categories, allRecipes, filteredRecipes] = await Promise.all([
      getRecipeCategories(),
      getRecipes(),
      getRecipes(apiParams),
    ])

    const recipes = filteredRecipes
    const filterCounts = getRecipeFilterCounts(allRecipes)
    const favoriteCount = allRecipes.filter((recipe) => recipe.isFavorite).length
    const favoriteRecipes = allRecipes.filter((recipe) => recipe.isFavorite).slice(0, 4)
    const totalCooked = allRecipes.reduce((sum, recipe) => sum + recipe.timesCooked, 0)
    const showGrouped = !hasFilters && recipes.length > 0
    const exportScopeLabel = getRecipeExportScopeLabel(
      params,
      favoritesOnly,
      categories.find((category) => category.id === params.categoryId)?.name
    )

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 dark:border-border/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200/90">
                  Vida pessoal
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                  Livro de receitas
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
                  Navegue por coleções, busque ingredientes e entre no modo preparo com checklist
                  passo a passo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <RecipeExportButton
                  filters={apiParams}
                  recipeCount={recipes.length}
                  scopeLabel={exportScopeLabel}
                  className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Link
                  href="/pessoal/receitas/importar"
                  className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <IconImport className="h-4 w-4" />
                  Importar
                </Link>
                <Link
                  href="/pessoal/receitas/nova"
                  className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <IconPlus className="h-4 w-4" />
                  Nova receita
                </Link>
              </div>
            </div>

            <div className="relative mt-7 grid grid-cols-3 gap-3 sm:max-w-xl">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Receitas</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {allRecipes.length}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Coleções</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {categories.length}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-300 sm:text-sm">Preparos</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">
                  {totalCooked}
                </p>
              </article>
            </div>
          </div>
        </section>

        {!hasFilters && favoriteRecipes.length > 0 ? (
          <section className="rounded-2xl border border-border/70 bg-surface p-5" aria-labelledby="favorite-recipes-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Acesso rápido
                </p>
                <h2
                  id="favorite-recipes-heading"
                  className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
                >
                  Favoritas
                </h2>
              </div>
              <Link
                href="/pessoal/receitas?favorites=1"
                className="text-sm font-semibold text-accent hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {favoriteRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/pessoal/receitas/${recipe.id}`}
                  className="interactive-lift flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
                >
                  <span className="text-lg text-amber-500" aria-hidden>
                    ★
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold">{recipe.title}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!hasFilters ? <RecentlyCookedStrip recipes={allRecipes} /> : null}

        <Suspense fallback={<RecipeToolbarFallback />}>
          <section className="panel space-y-4 p-4 md:p-5">
            <RecipeSearch initialValue={params.q ?? ""} />
            <RecipeFiltersPanel
              categories={categories}
              activeCategoryId={params.categoryId}
              favoritesOnly={favoritesOnly}
              uncategorized={filters.uncategorized}
              activeCategoryName={
                categories.find((category) => category.id === params.categoryId)?.name
              }
              filters={filters}
              counts={filterCounts}
              totalCount={allRecipes.length}
              favoriteCount={favoriteCount}
              searchQuery={params.q?.trim()}
            />
          </section>
        </Suspense>

        {recipes.length === 0 ? (
          <div className="panel-soft rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <IconRecipe className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-4 font-medium">
              {hasFilters ? "Nenhuma receita corresponde aos filtros" : "Nenhuma receita encontrada"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {hasFilters
                ? "Tente outro termo ou limpe os filtros para ver todas as receitas."
                : "Comece cadastrando sua primeira receita ou importe um lote inicial."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {hasFilters ? (
                <Link
                  href="/pessoal/receitas"
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent-soft/40"
                >
                  Limpar filtros
                </Link>
              ) : null}
              <Link
                href="/pessoal/receitas/importar"
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent-soft/40"
              >
                Importar lote
              </Link>
              <Link
                href="/pessoal/receitas/nova"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Criar receita
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hasFilters ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {recipes.length} receita{recipes.length === 1 ? "" : "s"} encontrada
                  {recipes.length === 1 ? "" : "s"}
                </p>
                <Link
                  href="/pessoal/receitas"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : null}

            {showGrouped ? (
              <RecipeGroupedList categories={categories} recipes={recipes} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        )}

        <RecipeCategoryManager categories={categories} />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    throw error
  }
}

export default ReceitasPage
