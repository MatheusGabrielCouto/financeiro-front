"use client"

import { useEffect, useState } from "react"
import { IconStudy } from "@/components/icons"
import { StudySessionForm } from "@/components/study-session-form"
import type { StudySubject } from "@/lib/types"

type PomodoroTimerProps = {
  subjects: StudySubject[]
}

type Mode = "focus" | "break"

const DEFAULT_FOCUS_MINUTES = 25
const DEFAULT_BREAK_MINUTES = 5
const SOUND_STORAGE_KEY = "pomodoro-sound-enabled"

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0")
  const seconds = (totalSeconds % 60).toString().padStart(2, "0")
  return `${minutes}:${seconds}`
}

const playBeep = () => {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const playTone = (startOffset: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = "sine"
      oscillator.frequency.value = 880
      const start = ctx.currentTime + startOffset
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2)
      oscillator.start(start)
      oscillator.stop(start + 0.25)
    }
    playTone(0)
    playTone(0.25)
  } catch {
    // Web Audio unavailable — fail silently, sound is a nice-to-have
  }
}

export const PomodoroTimer = ({ subjects }: PomodoroTimerProps) => {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "")
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [mode, setMode] = useState<Mode>("focus")
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [justCompletedFocus, setJustCompletedFocus] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY)
      if (stored === "0") setSoundEnabled(false)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (subjects.length === 0) return
    setSubjectId((current) =>
      subjects.some((subject) => subject.id === current) ? current : subjects[0].id
    )
  }, [subjects])

  useEffect(() => {
    if (running || justCompletedFocus) return
    setRemainingSeconds((mode === "focus" ? focusMinutes : breakMinutes) * 60)
  }, [focusMinutes, breakMinutes, mode, running, justCompletedFocus])

  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval)
          setRunning(false)
          if (soundEnabled) playBeep()

          if (mode === "focus") {
            setJustCompletedFocus(true)
            setCycleCount((count) => count + 1)
            return 0
          }

          setMode("focus")
          return focusMinutes * 60
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [running, mode, focusMinutes, soundEnabled])

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, next ? "1" : "0")
      } catch {
        // ignore
      }
      return next
    })
  }

  const startFocus = () => {
    setMode("focus")
    setRemainingSeconds(focusMinutes * 60)
    setJustCompletedFocus(false)
    setRunning(true)
  }

  const startBreak = () => {
    setMode("break")
    setRemainingSeconds(breakMinutes * 60)
    setJustCompletedFocus(false)
    setRunning(true)
  }

  const togglePause = () => setRunning((current) => !current)

  const reset = () => {
    setRunning(false)
    setJustCompletedFocus(false)
    setMode("focus")
    setRemainingSeconds(focusMinutes * 60)
  }

  const clampMinutes = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(value) || min))

  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-surface p-5 text-center shadow-sm shadow-slate-200/40 dark:shadow-none">
        <p className="text-sm font-medium">Crie uma matéria para usar o timer</p>
        <p className="mt-1 text-xs text-muted">
          O Pomodoro registra a sessão direto na matéria escolhida.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconStudy className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold">Pomodoro</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={running}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none ring-accent focus:ring-2 disabled:opacity-60"
            aria-label="Matéria do ciclo de foco"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? "Som ligado" : "Som desligado"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-border/60 py-3 text-xs">
        <label className="flex items-center gap-1.5 font-medium text-muted">
          Foco
          <input
            type="number"
            min={1}
            max={90}
            value={focusMinutes}
            disabled={running}
            onChange={(event) =>
              setFocusMinutes(clampMinutes(Number(event.target.value), 1, 90))
            }
            className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none ring-accent focus:ring-2 disabled:opacity-60"
            aria-label="Minutos de foco"
          />
          min
        </label>
        <label className="flex items-center gap-1.5 font-medium text-muted">
          Pausa
          <input
            type="number"
            min={1}
            max={60}
            value={breakMinutes}
            disabled={running}
            onChange={(event) =>
              setBreakMinutes(clampMinutes(Number(event.target.value), 1, 60))
            }
            className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none ring-accent focus:ring-2 disabled:opacity-60"
            aria-label="Minutos de pausa"
          />
          min
        </label>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {mode === "focus" ? "Foco" : "Pausa"}
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-5xl font-semibold tabular-nums">
          {formatClock(remainingSeconds)}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {remainingSeconds === focusMinutes * 60 && mode === "focus" && !running ? (
            <button
              type="button"
              onClick={startFocus}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Iniciar foco ({focusMinutes}min)
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePause}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              {running ? "Pausar" : "Retomar"}
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
          >
            Reiniciar
          </button>
        </div>

        {cycleCount > 0 ? (
          <p className="mt-3 text-xs text-muted">
            {cycleCount} {cycleCount === 1 ? "ciclo concluído" : "ciclos concluídos"} hoje
          </p>
        ) : null}
      </div>

      {justCompletedFocus ? (
        <div className="mt-5 rounded-xl border border-accent/30 bg-accent-soft/40 p-4 dark:bg-accent-soft/10">
          <p className="text-sm font-semibold">Ciclo de foco concluído 🎉</p>
          <p className="mt-1 text-xs text-muted">
            Confirme para registrar essa sessão na matéria, ou ajuste antes de salvar.
          </p>
          <div className="mt-3">
            <StudySessionForm
              subjectId={subjectId}
              initialDurationMinutes={focusMinutes}
              compact
            />
          </div>
          <button
            type="button"
            onClick={startBreak}
            className="mt-3 text-xs font-semibold text-accent hover:underline"
          >
            Iniciar pausa ({breakMinutes}min)
          </button>
        </div>
      ) : null}
    </div>
  )
}
