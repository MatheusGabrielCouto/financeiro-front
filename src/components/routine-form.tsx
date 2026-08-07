"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ROUTINE_COLORS,
  WEEKDAY_LABELS_SHORT,
  WEEKDAY_PRESETS,
  getRoutineColor,
} from "@/lib/routine-colors"

export const RoutineForm = () => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [color, setColor] = useState<string>(ROUTINE_COLORS[0].id)
  const [weekdays, setWeekdays] = useState<number[]>(WEEKDAY_PRESETS.daily)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const palette = getRoutineColor(color)

  const toggleWeekday = (day: number) => {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b)
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Informe um título")
      return
    }

    if (weekdays.length === 0) {
      setError("Selecione ao menos um dia da semana")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, notes, color, weekdays }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar a rotina"
        )
        return
      }

      setTitle("")
      setNotes("")
      setColor(ROUTINE_COLORS[0].id)
      setWeekdays(WEEKDAY_PRESETS.daily)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label="Nova rotina"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.from} ${palette.to} text-xs font-bold text-white`}
        >
          {title.trim() ? title.trim()[0].toUpperCase() : "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {title.trim() || "Nome da rotina"}
          </p>
          <p className="text-xs text-muted">Assim ela vai aparecer no dia a dia</p>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome da rotina</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Estudar de manhã"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Título da rotina"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Observação (opcional)</span>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex.: 30 minutos de inglês"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Observação da rotina"
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Cor</span>
        <div
          className="flex flex-wrap gap-2.5"
          role="group"
          aria-label="Escolher cor da rotina"
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

      <div className="space-y-1.5 border-t border-border/70 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dias da semana</span>
          <div className="flex gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setWeekdays([...WEEKDAY_PRESETS.daily])}
              className="rounded-md px-1.5 py-0.5 font-medium text-accent hover:bg-accent/10"
            >
              Todo dia
            </button>
            <button
              type="button"
              onClick={() => setWeekdays([...WEEKDAY_PRESETS.weekdays])}
              className="rounded-md px-1.5 py-0.5 font-medium text-accent hover:bg-accent/10"
            >
              Dias úteis
            </button>
          </div>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Selecionar dias da semana"
        >
          {WEEKDAY_LABELS_SHORT.map((label, day) => {
            const active = weekdays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                  active
                    ? `bg-gradient-to-br ${palette.from} ${palette.to} text-white shadow-sm`
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
                aria-pressed={active}
                aria-label={label}
              >
                {label}
              </button>
            )
          })}
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
        {isLoading ? "Salvando..." : "Criar rotina"}
      </button>
    </form>
  )
}
