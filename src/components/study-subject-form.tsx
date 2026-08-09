"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ROUTINE_COLORS, getRoutineColor } from "@/lib/routine-colors"

export const StudySubjectForm = () => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [color, setColor] = useState<string>(ROUTINE_COLORS[0].id)
  const [weeklyGoalHours, setWeeklyGoalHours] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const palette = getRoutineColor(color)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const goalValue = Number(weeklyGoalHours.replace(",", "."))

    if (!title.trim()) {
      setError("Informe um título")
      return
    }
    if (!Number.isFinite(goalValue) || goalValue <= 0) {
      setError("Informe uma meta semanal válida (em horas)")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/study-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          color,
          weeklyGoalHours: goalValue,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar a matéria"
        )
        return
      }

      setTitle("")
      setColor(ROUTINE_COLORS[0].id)
      setWeeklyGoalHours("")
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Nova matéria">
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.from} ${palette.to} text-xs font-bold text-white`}
        >
          {title.trim() ? title.trim()[0].toUpperCase() : "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {title.trim() || "Nome da matéria"}
          </p>
          <p className="text-xs text-muted">Assim ela vai aparecer em /estudos</p>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Matéria</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Inglês, Espanhol, Matemática..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome da matéria"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Meta semanal (horas)</span>
        <input
          inputMode="decimal"
          value={weeklyGoalHours}
          onChange={(event) => setWeeklyGoalHours(event.target.value)}
          placeholder="5"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Meta semanal em horas"
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Cor</span>
        <div
          className="flex flex-wrap gap-2.5"
          role="group"
          aria-label="Escolher cor da matéria"
        >
          {ROUTINE_COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setColor(item.id)}
              className={`h-9 w-9 rounded-full bg-gradient-to-br ${item.from} ${item.to} transition ${
                color === item.id
                  ? "scale-110 ring-2 ring-offset-2 ring-offset-surface " + item.ring
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={item.label}
              aria-pressed={color === item.id}
            />
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isLoading ? "Salvando..." : "Criar matéria"}
      </button>
    </form>
  )
}
