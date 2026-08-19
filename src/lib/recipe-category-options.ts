import type { ModuleAccentToken } from "@/lib/nav-registry"

export const RECIPE_CATEGORY_COLOR_OPTIONS: {
  id: ModuleAccentToken
  label: string
}[] = [
  { id: "indigo", label: "Índigo" },
  { id: "sky", label: "Azul" },
  { id: "cyan", label: "Ciano" },
  { id: "violet", label: "Violeta" },
  { id: "rose", label: "Rosa" },
  { id: "emerald", label: "Verde" },
  { id: "amber", label: "Âmbar" },
  { id: "orange", label: "Laranja" },
  { id: "fuchsia", label: "Fúcsia" },
]

export const RECIPE_CATEGORY_EMOJI_PRESETS = [
  "☕",
  "🧊",
  "🍫",
  "🍽️",
  "🥐",
  "🍰",
  "🥤",
  "🍳",
  "🥗",
  "🍝",
] as const

export const resolveRecipeCategoryColor = (color: string): ModuleAccentToken => {
  const match = RECIPE_CATEGORY_COLOR_OPTIONS.find((option) => option.id === color)
  return match?.id ?? "violet"
}
