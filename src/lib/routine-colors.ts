export const ROUTINE_COLORS = [
  {
    id: "teal",
    label: "Verde-água",
    dot: "bg-teal-500",
    bg: "bg-teal-50 dark:bg-teal-500/10",
    text: "text-teal-700 dark:text-teal-300",
    ring: "ring-teal-500",
    border: "border-teal-300 dark:border-teal-500/40",
    track: "bg-teal-100 dark:bg-teal-500/15",
    from: "from-teal-400",
    to: "to-teal-600",
  },
  {
    id: "amber",
    label: "Âmbar",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500",
    border: "border-amber-300 dark:border-amber-500/40",
    track: "bg-amber-100 dark:bg-amber-500/15",
    from: "from-amber-400",
    to: "to-amber-600",
  },
  {
    id: "rose",
    label: "Rosa",
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500",
    border: "border-rose-300 dark:border-rose-500/40",
    track: "bg-rose-100 dark:bg-rose-500/15",
    from: "from-rose-400",
    to: "to-rose-600",
  },
  {
    id: "violet",
    label: "Violeta",
    dot: "bg-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-500",
    border: "border-violet-300 dark:border-violet-500/40",
    track: "bg-violet-100 dark:bg-violet-500/15",
    from: "from-violet-400",
    to: "to-violet-600",
  },
  {
    id: "blue",
    label: "Azul",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500",
    border: "border-blue-300 dark:border-blue-500/40",
    track: "bg-blue-100 dark:bg-blue-500/15",
    from: "from-blue-400",
    to: "to-blue-600",
  },
  {
    id: "emerald",
    label: "Esmeralda",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500",
    border: "border-emerald-300 dark:border-emerald-500/40",
    track: "bg-emerald-100 dark:bg-emerald-500/15",
    from: "from-emerald-400",
    to: "to-emerald-600",
  },
] as const

export type RoutineColorId = (typeof ROUTINE_COLORS)[number]["id"]

export const getRoutineColor = (id: string) =>
  ROUTINE_COLORS.find((color) => color.id === id) ?? ROUTINE_COLORS[0]

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const
export const WEEKDAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"] as const

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
export const WEEKDAY_PRESETS = {
  daily: ALL_WEEKDAYS,
  weekdays: [1, 2, 3, 4, 5],
  weekend: [0, 6],
} as const

export const formatWeekdays = (weekdays: number[]) => {
  const sorted = [...weekdays].sort((a, b) => a - b)
  if (sorted.length === 7) return "Todo dia"
  if (sorted.join(",") === "1,2,3,4,5") return "Dias úteis"
  if (sorted.join(",") === "0,6") return "Fins de semana"
  return sorted.map((day) => WEEKDAY_LABELS[day]).join(", ")
}
