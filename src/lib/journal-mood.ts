export type MoodOption = {
  value: number
  emoji: string
  label: string
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: "😞", label: "Péssimo" },
  { value: 2, emoji: "😕", label: "Ruim" },
  { value: 3, emoji: "😐", label: "Neutro" },
  { value: 4, emoji: "🙂", label: "Bom" },
  { value: 5, emoji: "😄", label: "Ótimo" },
]

export const getMoodOption = (mood: number | null): MoodOption | null =>
  MOOD_OPTIONS.find((option) => option.value === mood) ?? null
