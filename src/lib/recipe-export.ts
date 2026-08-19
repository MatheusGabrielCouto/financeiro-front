import { RECIPE_DIFFICULTY_LABELS } from "@/lib/recipe-labels"
import type { Recipe, RecipeDifficulty } from "@/lib/types"

export type RecipeExportFormat = "text" | "json"

export type RecipeExportPayload = {
  exportedAt: string
  recipeCount: number
  recipes: RecipeExportItem[]
}

export type RecipeExportItem = {
  title: string
  description: string
  category: string | null
  servings: number | null
  prepMinutes: number | null
  cookMinutes: number | null
  difficulty: RecipeDifficulty | null
  ingredients: {
    name: string
    quantity: string | null
    unit: string | null
    groupLabel: string | null
  }[]
  steps: {
    instruction: string
    timerMinutes: number | null
  }[]
  isFavorite: boolean
  timesCooked: number
}

const difficultyToText = (difficulty: RecipeDifficulty | null) => {
  if (!difficulty) return null
  return RECIPE_DIFFICULTY_LABELS[difficulty].toLowerCase()
}

export const toRecipeExportItem = (recipe: Recipe): RecipeExportItem => ({
  title: recipe.title,
  description: recipe.description,
  category: recipe.category?.name ?? null,
  servings: recipe.servings,
  prepMinutes: recipe.prepMinutes,
  cookMinutes: recipe.cookMinutes,
  difficulty: recipe.difficulty,
  ingredients: recipe.ingredients.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    groupLabel: item.groupLabel,
  })),
  steps: recipe.steps.map((item) => ({
    instruction: item.instruction,
    timerMinutes: item.timerMinutes,
  })),
  isFavorite: recipe.isFavorite,
  timesCooked: recipe.timesCooked,
})

export const buildRecipeExportPayload = (recipes: Recipe[]): RecipeExportPayload => ({
  exportedAt: new Date().toISOString(),
  recipeCount: recipes.length,
  recipes: recipes.map(toRecipeExportItem),
})

const formatIngredientLine = (item: RecipeExportItem["ingredients"][number]) => {
  const parts = [item.quantity, item.unit, item.name].filter(Boolean)
  const base = parts.join(" ")
  return item.groupLabel ? `- ${base} [${item.groupLabel}]` : `- ${base}`
}

const formatStepLine = (item: RecipeExportItem["steps"][number], index: number) => {
  const timer = item.timerMinutes ? ` (${item.timerMinutes} min)` : ""
  return `${index + 1}. ${item.instruction}${timer}`
}

const formatRecipeBlock = (recipe: RecipeExportItem, includeCategoryLine: boolean) => {
  const lines: string[] = [`# ${recipe.title}`]

  if (includeCategoryLine && recipe.category) {
    lines.push(`Categoria: ${recipe.category}`)
  }

  if (recipe.description.trim()) {
    lines.push(`Descrição: ${recipe.description.trim()}`)
  }

  if (recipe.servings) lines.push(`Porções: ${recipe.servings}`)
  if (recipe.prepMinutes) lines.push(`Preparo: ${recipe.prepMinutes} min`)
  if (recipe.cookMinutes) lines.push(`Cozimento: ${recipe.cookMinutes} min`)

  const difficulty = difficultyToText(recipe.difficulty)
  if (difficulty) lines.push(`Dificuldade: ${difficulty}`)

  lines.push("", "## Ingredientes")
  if (recipe.ingredients.length === 0) {
    lines.push("- ")
  } else {
    recipe.ingredients.forEach((item) => lines.push(formatIngredientLine(item)))
  }

  lines.push("", "## Passos")
  if (recipe.steps.length === 0) {
    lines.push("1. ")
  } else {
    recipe.steps.forEach((item, index) => lines.push(formatStepLine(item, index)))
  }

  return lines.join("\n")
}

export const formatRecipesExportText = (recipes: Recipe[]): string => {
  if (recipes.length === 0) return ""

  const items = recipes.map(toRecipeExportItem)
  const grouped = new Map<string, RecipeExportItem[]>()

  items.forEach((recipe) => {
    const key = recipe.category ?? "__sem_categoria__"
    const bucket = grouped.get(key) ?? []
    bucket.push(recipe)
    grouped.set(key, bucket)
  })

  const blocks: string[] = []

  grouped.forEach((groupRecipes, categoryKey) => {
    const categoryName = categoryKey === "__sem_categoria__" ? null : categoryKey

    if (categoryName) {
      blocks.push(`@ ${categoryName}\n`)
    }

    groupRecipes.forEach((recipe, index) => {
      if (index > 0) blocks.push("\n---\n")
      blocks.push(formatRecipeBlock(recipe, !categoryName))
    })
  })

  return blocks.join("\n").trim()
}

export const formatRecipesExportJson = (recipes: Recipe[]): string => {
  const payload = buildRecipeExportPayload(recipes)
  const importReady = {
    exportedAt: payload.exportedAt,
    recipeCount: payload.recipeCount,
    recipes: payload.recipes.map(({ isFavorite, timesCooked, ...recipe }) => ({
      ...recipe,
      ...(isFavorite ? { isFavorite } : {}),
      ...(timesCooked > 0 ? { timesCooked } : {}),
    })),
  }

  return `${JSON.stringify(importReady, null, 2)}\n`
}

export const formatRecipesExport = (recipes: Recipe[], format: RecipeExportFormat) => {
  if (format === "json") return formatRecipesExportJson(recipes)
  return formatRecipesExportText(recipes)
}

export const getRecipeExportFilename = (format: RecipeExportFormat) => {
  const date = new Date().toISOString().slice(0, 10)
  return `receitas-${date}.${format === "json" ? "json" : "txt"}`
}

export const downloadRecipeExport = (content: string, format: RecipeExportFormat) => {
  const blob = new Blob([content], {
    type: format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = getRecipeExportFilename(format)
  anchor.click()
  URL.revokeObjectURL(url)
}
