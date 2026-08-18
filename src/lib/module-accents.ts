import type { ModuleAccentToken } from "@/lib/nav-registry"

type ModuleAccentClasses = {
  iconBg: string
  iconText: string
  activeBg: string
  activeText: string
  activeRing: string
  dot: string
  cardAccentBar: string
}

export const MODULE_ACCENTS: Record<ModuleAccentToken, ModuleAccentClasses> = {
  violet: {
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconText: "text-violet-600 dark:text-violet-300",
    activeBg: "bg-violet-50 dark:bg-violet-500/15",
    activeText: "text-violet-700 dark:text-violet-200",
    activeRing: "ring-1 ring-inset ring-violet-500/15",
    dot: "bg-violet-500",
    cardAccentBar: "bg-violet-500",
  },
  cyan: {
    iconBg: "bg-cyan-100 dark:bg-cyan-500/15",
    iconText: "text-cyan-600 dark:text-cyan-300",
    activeBg: "bg-cyan-50 dark:bg-cyan-500/15",
    activeText: "text-cyan-700 dark:text-cyan-200",
    activeRing: "ring-1 ring-inset ring-cyan-500/15",
    dot: "bg-cyan-500",
    cardAccentBar: "bg-cyan-500",
  },
  sky: {
    iconBg: "bg-sky-100 dark:bg-sky-500/15",
    iconText: "text-sky-600 dark:text-sky-300",
    activeBg: "bg-sky-50 dark:bg-sky-500/15",
    activeText: "text-sky-700 dark:text-sky-200",
    activeRing: "ring-1 ring-inset ring-sky-500/15",
    dot: "bg-sky-500",
    cardAccentBar: "bg-sky-500",
  },
  indigo: {
    iconBg: "bg-indigo-100 dark:bg-indigo-500/15",
    iconText: "text-indigo-600 dark:text-indigo-300",
    activeBg: "bg-indigo-50 dark:bg-indigo-500/15",
    activeText: "text-indigo-700 dark:text-indigo-200",
    activeRing: "ring-1 ring-inset ring-indigo-500/15",
    dot: "bg-indigo-500",
    cardAccentBar: "bg-indigo-500",
  },
  fuchsia: {
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-500/15",
    iconText: "text-fuchsia-600 dark:text-fuchsia-300",
    activeBg: "bg-fuchsia-50 dark:bg-fuchsia-500/15",
    activeText: "text-fuchsia-700 dark:text-fuchsia-200",
    activeRing: "ring-1 ring-inset ring-fuchsia-500/15",
    dot: "bg-fuchsia-500",
    cardAccentBar: "bg-fuchsia-500",
  },
  rose: {
    iconBg: "bg-rose-100 dark:bg-rose-500/15",
    iconText: "text-rose-600 dark:text-rose-300",
    activeBg: "bg-rose-50 dark:bg-rose-500/15",
    activeText: "text-rose-700 dark:text-rose-200",
    activeRing: "ring-1 ring-inset ring-rose-500/15",
    dot: "bg-rose-500",
    cardAccentBar: "bg-rose-500",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-300",
    activeBg: "bg-amber-50 dark:bg-amber-500/15",
    activeText: "text-amber-700 dark:text-amber-200",
    activeRing: "ring-1 ring-inset ring-amber-500/15",
    dot: "bg-amber-500",
    cardAccentBar: "bg-amber-500",
  },
  orange: {
    iconBg: "bg-orange-100 dark:bg-orange-500/15",
    iconText: "text-orange-600 dark:text-orange-300",
    activeBg: "bg-orange-50 dark:bg-orange-500/15",
    activeText: "text-orange-700 dark:text-orange-200",
    activeRing: "ring-1 ring-inset ring-orange-500/15",
    dot: "bg-orange-500",
    cardAccentBar: "bg-orange-500",
  },
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-300",
    activeBg: "bg-emerald-50 dark:bg-emerald-500/15",
    activeText: "text-emerald-700 dark:text-emerald-200",
    activeRing: "ring-1 ring-inset ring-emerald-500/15",
    dot: "bg-emerald-500",
    cardAccentBar: "bg-emerald-500",
  },
}

export const getModuleAccentClasses = (token: ModuleAccentToken): ModuleAccentClasses =>
  MODULE_ACCENTS[token]
