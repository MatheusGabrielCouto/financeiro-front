export type NotebookColorToken = "amber" | "sage" | "dusk" | "berry" | "sky" | "clay"

type NotebookColorTokens = {
  bg: string
  text: string
  ring: string
}

export const NOTEBOOK_COLORS: Record<NotebookColorToken, NotebookColorTokens> = {
  amber: { bg: "bg-amber-400/90", text: "text-amber-950", ring: "ring-amber-400/60" },
  sage: { bg: "bg-emerald-500/80", text: "text-emerald-950", ring: "ring-emerald-400/60" },
  dusk: { bg: "bg-indigo-500/80", text: "text-indigo-50", ring: "ring-indigo-400/60" },
  berry: { bg: "bg-rose-500/80", text: "text-rose-50", ring: "ring-rose-400/60" },
  sky: { bg: "bg-sky-500/80", text: "text-sky-50", ring: "ring-sky-400/60" },
  clay: { bg: "bg-orange-600/80", text: "text-orange-50", ring: "ring-orange-400/60" },
}

export const NOTEBOOK_COLOR_OPTIONS = Object.keys(NOTEBOOK_COLORS) as NotebookColorToken[]

export const getNotebookColorTokens = (color: string): NotebookColorTokens =>
  NOTEBOOK_COLORS[color as NotebookColorToken] ?? NOTEBOOK_COLORS.amber
