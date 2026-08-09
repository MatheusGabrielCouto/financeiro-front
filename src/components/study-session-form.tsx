"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { STUDY_SKILLS } from "@/lib/study-skills"

type StudySessionFormProps = {
  subjectId: string
  /** Pre-fills the duration field, e.g. after a Pomodoro focus cycle completes. */
  initialDurationMinutes?: number
  /** Compact layout for use inside a subject card instead of a standalone panel. */
  compact?: boolean
}

export const StudySessionForm = ({
  subjectId,
  initialDurationMinutes,
  compact = false,
}: StudySessionFormProps) => {
  const router = useRouter()
  const [durationMinutes, setDurationMinutes] = useState(
    initialDurationMinutes ? String(initialDurationMinutes) : ""
  )
  const [skill, setSkill] = useState("")
  const [topic, setTopic] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!subjectId) {
      setError("Selecione uma matéria antes de registrar")
      return
    }

    const minutes = Number(durationMinutes)

    if (!Number.isInteger(minutes) || minutes <= 0) {
      setError("Informe uma duração válida em minutos")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/study-subject/${subjectId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: minutes, skill, topic: topic.trim() }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível registrar a sessão"
        )
        return
      }

      setDurationMinutes("")
      setSkill("")
      setTopic("")
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
      className={compact ? "flex flex-wrap items-center gap-2" : "space-y-3"}
      aria-label="Registrar sessão de estudo"
    >
      <div
        className="flex w-full flex-wrap gap-1.5"
        role="group"
        aria-label="Habilidade praticada"
      >
        {STUDY_SKILLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSkill((current) => (current === item.id ? "" : item.id))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              skill === item.id
                ? "bg-accent text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
            aria-pressed={skill === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <input
        inputMode="numeric"
        value={durationMinutes}
        onChange={(event) => setDurationMinutes(event.target.value)}
        placeholder="Minutos"
        className={
          compact
            ? "w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none ring-accent focus:ring-2"
            : "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        }
        aria-label="Duração em minutos"
      />
      <input
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        placeholder="Ex.: podcast, série, livro... (opcional)"
        className={
          compact
            ? "min-w-[9rem] flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none ring-accent focus:ring-2"
            : "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        }
        aria-label="Anotação da sessão"
      />
      <button
        type="submit"
        disabled={isLoading}
        className={
          compact
            ? "rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            : "w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        }
      >
        {isLoading ? "Salvando..." : "Registrar sessão"}
      </button>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
