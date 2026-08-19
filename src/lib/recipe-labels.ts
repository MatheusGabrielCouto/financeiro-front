import type { RecipeDifficulty } from "@/lib/types"

export const RECIPE_DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
}

export const formatRecipeDuration = (prep?: number | null, cook?: number | null) => {
  const total = (prep ?? 0) + (cook ?? 0)
  if (total <= 0) return null
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

export const formatIngredientLine = (item: {
  name: string
  quantity: string | null
  unit: string | null
}) => {
  const parts = [item.quantity, item.unit, item.name].filter(Boolean)
  return parts.join(" ")
}
