import { MODULE_ACCENTS, getModuleAccentClasses } from "@/lib/module-accents"
import type { ModuleAccentToken } from "@/lib/nav-registry"

const LEGACY_CATEGORY_COLORS: Record<string, ModuleAccentToken> = {
  amber: "indigo",
  cyan: "sky",
  orange: "rose",
}

const PLACEHOLDER_GRADIENTS: Record<ModuleAccentToken, string> = {
  violet:
    "from-slate-100 via-violet-50/50 to-slate-200 dark:from-slate-900 dark:via-violet-950/25 dark:to-slate-800",
  cyan: "from-slate-100 via-cyan-50/40 to-slate-200 dark:from-slate-900 dark:via-cyan-950/20 dark:to-slate-800",
  sky: "from-slate-100 via-sky-50/40 to-slate-200 dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-800",
  indigo:
    "from-slate-100 via-indigo-50/40 to-slate-200 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-800",
  fuchsia:
    "from-slate-100 via-fuchsia-50/35 to-slate-200 dark:from-slate-900 dark:via-fuchsia-950/20 dark:to-slate-800",
  rose: "from-slate-100 via-rose-50/35 to-slate-200 dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-800",
  amber:
    "from-slate-100 via-amber-50/30 to-slate-200 dark:from-slate-900 dark:via-amber-950/15 dark:to-slate-800",
  orange:
    "from-slate-100 via-orange-50/30 to-slate-200 dark:from-slate-900 dark:via-orange-950/15 dark:to-slate-800",
  emerald:
    "from-slate-100 via-emerald-50/35 to-slate-200 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-800",
}

const resolveCategoryAccent = (color: string): ModuleAccentToken => {
  const mapped = LEGACY_CATEGORY_COLORS[color] ?? color
  if (mapped in MODULE_ACCENTS) return mapped as ModuleAccentToken
  return "violet"
}

export type RecipeCategoryVisual = {
  token: ModuleAccentToken
  chip: string
  chipActive: string
  placeholder: string
  label: string
  iconBg: string
}

export const getRecipeCategoryVisual = (color: string): RecipeCategoryVisual => {
  const token = resolveCategoryAccent(color)
  const accent = getModuleAccentClasses(token)

  return {
    token,
    chip: `border border-border/80 ${accent.activeBg} ${accent.activeText}`,
    chipActive: `${accent.dot} border-transparent text-white`,
    placeholder: PLACEHOLDER_GRADIENTS[token],
    label: accent.activeText,
    iconBg: accent.iconBg,
  }
}
