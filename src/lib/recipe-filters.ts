import type { RecipeDifficulty, RecipeListItem } from "@/lib/types"
import type { RecipeListQueryParams } from "@/lib/finance-api"
import { RECIPE_DIFFICULTY_LABELS } from "@/lib/recipe-labels"

export type RecipeDifficultyFilter = RecipeDifficulty | "all"
export type RecipeMaxTimeFilter = "all" | "15" | "30" | "60"
export type RecipeCookedFilter = "all" | "1" | "0"
export type RecipeSort = "recent" | "title" | "cooked" | "quick"

export type RecipeSearchParams = {
  categoryId?: string
  q?: string
  favorites?: string
  difficulty?: string
  maxTime?: string
  cooked?: string
  uncategorized?: string
  sort?: string
}

export type RecipeFilterState = {
  difficulty: RecipeDifficultyFilter
  maxTime: RecipeMaxTimeFilter
  cooked: RecipeCookedFilter
  uncategorized: boolean
  sort: RecipeSort
}

export const getRecipeTotalMinutes = (recipe: RecipeListItem) =>
  (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)

export const parseRecipeDifficultyFilter = (value?: string): RecipeDifficultyFilter => {
  if (value === "EASY" || value === "MEDIUM" || value === "HARD") return value
  return "all"
}

export const parseRecipeMaxTimeFilter = (value?: string): RecipeMaxTimeFilter => {
  if (value === "15" || value === "30" || value === "60") return value
  return "all"
}

export const parseRecipeCookedFilter = (value?: string): RecipeCookedFilter => {
  if (value === "1" || value === "0") return value
  return "all"
}

export const parseRecipeSort = (value?: string): RecipeSort => {
  if (value === "title" || value === "cooked" || value === "quick") return value
  return "recent"
}

export const parseRecipeFilters = (params: RecipeSearchParams): RecipeFilterState => ({
  difficulty: parseRecipeDifficultyFilter(params.difficulty),
  maxTime: parseRecipeMaxTimeFilter(params.maxTime),
  cooked: parseRecipeCookedFilter(params.cooked),
  uncategorized: params.uncategorized === "1",
  sort: parseRecipeSort(params.sort),
})

export const hasRecipeAdvancedFilters = (filters: RecipeFilterState) =>
  filters.difficulty !== "all" ||
  filters.maxTime !== "all" ||
  filters.cooked !== "all" ||
  filters.uncategorized ||
  filters.sort !== "recent"

export const hasRecipeListFilters = (
  params: RecipeSearchParams,
  favoritesOnly: boolean
) => {
  const filters = parseRecipeFilters(params)
  return Boolean(
    params.categoryId ||
      params.q?.trim() ||
      favoritesOnly ||
      hasRecipeAdvancedFilters(filters)
  )
}

export const buildRecipeListQuery = (params?: {
  categoryId?: string
  search?: string
  includeArchived?: boolean
  favoritesOnly?: boolean
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  maxTime?: "15" | "30" | "60"
  cooked?: "0" | "1"
  uncategorized?: boolean
  sort?: "recent" | "title" | "cooked" | "quick"
}) => {
  const query = new URLSearchParams()
  if (params?.categoryId) query.set("categoryId", params.categoryId)
  if (params?.search) query.set("search", params.search)
  if (params?.includeArchived) query.set("includeArchived", "true")
  if (params?.favoritesOnly) query.set("favoritesOnly", "true")
  if (params?.difficulty) query.set("difficulty", params.difficulty)
  if (params?.maxTime) query.set("maxTime", params.maxTime)
  if (params?.cooked) query.set("cooked", params.cooked)
  if (params?.uncategorized) query.set("uncategorized", "1")
  if (params?.sort && params.sort !== "recent") query.set("sort", params.sort)
  return query
}

export const buildRecipeApiParams = (
  params: RecipeSearchParams,
  favoritesOnly: boolean
): RecipeListQueryParams => ({
  categoryId: params.uncategorized === "1" ? undefined : params.categoryId,
  search: params.q,
  favoritesOnly,
  difficulty:
    params.difficulty === "EASY" ||
    params.difficulty === "MEDIUM" ||
    params.difficulty === "HARD"
      ? params.difficulty
      : undefined,
  maxTime:
    params.maxTime === "15" || params.maxTime === "30" || params.maxTime === "60"
      ? params.maxTime
      : undefined,
  cooked: params.cooked === "1" ? "1" : params.cooked === "0" ? "0" : undefined,
  uncategorized: params.uncategorized === "1",
  sort: parseRecipeSort(params.sort),
})

export const getRecipeFilterCounts = (recipes: RecipeListItem[]) => ({
  difficulty: {
    EASY: recipes.filter((recipe) => recipe.difficulty === "EASY").length,
    MEDIUM: recipes.filter((recipe) => recipe.difficulty === "MEDIUM").length,
    HARD: recipes.filter((recipe) => recipe.difficulty === "HARD").length,
  },
  maxTime: {
    "15": recipes.filter((recipe) => {
      const total = getRecipeTotalMinutes(recipe)
      return total > 0 && total <= 15
    }).length,
    "30": recipes.filter((recipe) => {
      const total = getRecipeTotalMinutes(recipe)
      return total > 0 && total <= 30
    }).length,
    "60": recipes.filter((recipe) => {
      const total = getRecipeTotalMinutes(recipe)
      return total > 0 && total <= 60
    }).length,
  },
  cooked: {
    "1": recipes.filter((recipe) => recipe.timesCooked > 0).length,
    "0": recipes.filter((recipe) => recipe.timesCooked === 0).length,
  },
  uncategorized: recipes.filter((recipe) => !recipe.categoryId).length,
})

export type RecipeActiveFilterChip = {
  id: string
  label: string
}

const SORT_LABELS: Record<Exclude<RecipeSort, "recent">, string> = {
  title: "A–Z",
  cooked: "Mais preparadas",
  quick: "Mais rápidas",
}

export const getActiveRecipeFilterChips = (
  params: RecipeSearchParams,
  favoritesOnly: boolean,
  filters: RecipeFilterState,
  categoryName?: string | null
): RecipeActiveFilterChip[] => {
  const chips: RecipeActiveFilterChip[] = []

  if (favoritesOnly) chips.push({ id: "favorites", label: "Favoritas" })
  if (params.uncategorized === "1") {
    chips.push({ id: "uncategorized", label: "Sem coleção" })
  } else if (params.categoryId && categoryName) {
    chips.push({ id: "category", label: categoryName })
  }

  if (filters.difficulty !== "all") {
    chips.push({
      id: "difficulty",
      label: RECIPE_DIFFICULTY_LABELS[filters.difficulty],
    })
  }

  if (filters.maxTime !== "all") {
    const label =
      filters.maxTime === "60" ? "Até 1 h" : `Até ${filters.maxTime} min`
    chips.push({ id: "maxTime", label })
  }

  if (filters.cooked === "1") chips.push({ id: "cooked-yes", label: "Já preparei" })
  if (filters.cooked === "0") chips.push({ id: "cooked-no", label: "Nunca fiz" })

  if (filters.sort !== "recent") {
    chips.push({ id: "sort", label: SORT_LABELS[filters.sort] })
  }

  return chips
}

export const countActiveRecipeFilters = (
  params: RecipeSearchParams,
  favoritesOnly: boolean,
  filters: RecipeFilterState,
  categoryName?: string | null
) => getActiveRecipeFilterChips(params, favoritesOnly, filters, categoryName).length

export const getRecipeExportScopeLabel = (
  params: RecipeSearchParams,
  favoritesOnly: boolean,
  categoryName?: string | null
) => {
  if (favoritesOnly) return "Favoritas"
  if (params.uncategorized === "1") return "Sem coleção"
  if (params.q?.trim()) return `Busca: ${params.q.trim()}`
  if (params.categoryId) return categoryName ?? "Filtradas"

  const filters = parseRecipeFilters(params)
  const labels: string[] = []

  if (filters.difficulty !== "all") {
    labels.push(
      filters.difficulty === "EASY"
        ? "Fácil"
        : filters.difficulty === "MEDIUM"
          ? "Médio"
          : "Difícil"
    )
  }
  if (filters.maxTime !== "all") {
    labels.push(`Até ${filters.maxTime} min`)
  }
  if (filters.cooked === "1") labels.push("Já preparei")
  if (filters.cooked === "0") labels.push("Nunca fiz")

  return labels.length > 0 ? labels.join(" · ") : "Todas as receitas"
}
