"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconClose } from "@/components/icons"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"
import { formatIngredientLine } from "@/lib/recipe-labels"
import type { Recipe, RecipeCookSession } from "@/lib/types"

type RecipeCookModeProps = {
  recipe: Recipe
  initialSession: RecipeCookSession | null
}

type CookPhase = "ingredientes" | "passos"

const formatTimer = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const RecipeCookMode = ({ recipe, initialSession }: RecipeCookModeProps) => {
  const router = useRouter()
  const visual = getRecipeCategoryVisual(recipe.category?.color ?? "violet")

  const [session, setSession] = useState<RecipeCookSession | null>(initialSession)
  const [phase, setPhase] = useState<CookPhase>("ingredientes")
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>(
    initialSession?.checkedIngredientIds ?? []
  )
  const [checkedSteps, setCheckedSteps] = useState<string[]>(
    initialSession?.checkedStepIds ?? []
  )
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completedMessage, setCompletedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) return

    const startSession = async () => {
      try {
        const response = await fetch(
          `/api/proxy/recipe/${recipe.id}/cook-session/start`,
          { method: "POST" }
        )
        if (!response.ok) return
        const data = (await response.json()) as RecipeCookSession
        setSession(data)
        setCheckedIngredients(data.checkedIngredientIds)
        setCheckedSteps(data.checkedStepIds)
      } catch {
        setError("Não foi possível iniciar o preparo")
      }
    }

    void startSession()
  }, [recipe.id, session])

  const persistSession = useCallback(
    async (nextIngredients: string[], nextSteps: string[]) => {
      if (!session) return
      setIsSaving(true)
      try {
        await fetch(`/api/proxy/recipe/${recipe.id}/cook-session`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkedIngredientIds: nextIngredients,
            checkedStepIds: nextSteps,
          }),
        })
      } catch {
        setError("Erro ao salvar progresso")
      } finally {
        setIsSaving(false)
      }
    },
    [recipe.id, session]
  )

  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(() => {
      void persistSession(checkedIngredients, checkedSteps)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [checkedIngredients, checkedSteps, persistSession, session])

  useEffect(() => {
    setTimerSeconds(null)
  }, [activeStepIndex])

  const isTimerRunning = timerSeconds !== null && timerSeconds > 0

  useEffect(() => {
    if (!isTimerRunning) return
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current === null || current <= 1) return 0
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isTimerRunning])

  const ingredientGroups = useMemo(() => {
    const groups = new Map<string, typeof recipe.ingredients>()
    for (const item of recipe.ingredients) {
      const key = item.groupLabel?.trim() || "Ingredientes"
      const list = groups.get(key) ?? []
      list.push(item)
      groups.set(key, list)
    }
    return [...groups.entries()]
  }, [recipe.ingredients])

  const ingredientsDone = checkedIngredients.length
  const ingredientsTotal = recipe.ingredients.length
  const stepsDone = checkedSteps.length
  const stepsTotal = recipe.steps.length
  const totalItems = ingredientsTotal + stepsTotal
  const doneItems = ingredientsDone + stepsDone
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const allIngredientsChecked =
    ingredientsTotal === 0 || ingredientsDone >= ingredientsTotal
  const allStepsChecked = stepsTotal === 0 || stepsDone >= stepsTotal

  const firstOpenStepIndex = recipe.steps.findIndex(
    (step) => !checkedSteps.includes(step.id)
  )
  const focusedStepIndex =
    firstOpenStepIndex === -1
      ? Math.max(recipe.steps.length - 1, 0)
      : firstOpenStepIndex

  useEffect(() => {
    setActiveStepIndex(focusedStepIndex)
  }, [focusedStepIndex])

  const activeStep = recipe.steps[activeStepIndex]

  const handleToggleIngredient = (id: string) => {
    setCheckedIngredients((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const handleToggleStep = (id: string) => {
    setCheckedSteps((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const handleMarkStepDone = (stepId: string) => {
    setCheckedSteps((current) =>
      current.includes(stepId) ? current : [...current, stepId]
    )
    if (activeStepIndex < recipe.steps.length - 1) {
      setActiveStepIndex((index) => index + 1)
    }
  }

  const handleStartTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60)
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/proxy/recipe/${recipe.id}/cook-session/complete`,
        { method: "POST" }
      )
      if (!response.ok) {
        setError("Erro ao concluir preparo")
        return
      }
      const data = (await response.json()) as {
        historyCount: number
        durationMinutes: number
      }
      setCompletedMessage(
        `Preparo #${data.historyCount} concluído em ${data.durationMinutes} min`
      )
      router.refresh()
    } catch {
      setError("Erro ao concluir preparo")
    } finally {
      setIsCompleting(false)
    }
  }

  const handleAbandon = async () => {
    setError(null)
    try {
      await fetch(`/api/proxy/recipe/${recipe.id}/cook-session/abandon`, {
        method: "POST",
      })
      router.push(`/pessoal/receitas/${recipe.id}`)
      router.refresh()
    } catch {
      setError("Erro ao abandonar preparo")
    }
  }

  if (completedMessage) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconCheck className="h-10 w-10" />
        </span>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            Preparo concluído
          </h1>
          <p className="mt-2 text-sm text-muted">{completedMessage}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={`/pessoal/receitas/${recipe.id}/preparar`}
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent-soft/40"
          >
            Preparar de novo
          </Link>
          <Link
            href={`/pessoal/receitas/${recipe.id}`}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Voltar para a receita
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-32">
      <header className="sticky top-0 z-20 -mx-1 border-b border-border/70 bg-background/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex items-start gap-3">
          <Link
            href={`/pessoal/receitas/${recipe.id}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border transition hover:bg-accent-soft/40"
            aria-label="Sair do modo preparo"
            tabIndex={0}
          >
            <IconClose className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Modo preparo
            </p>
            <h1 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
              {recipe.title}
            </h1>
            {recipe.category ? (
              <p className="mt-0.5 truncate text-xs text-muted">
                {recipe.category.emoji} {recipe.category.name}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold text-accent">{progress}%</p>
            <p className="text-xs text-muted">{isSaving ? "Salvando..." : "Progresso"}</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-accent-soft/50">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-surface p-1"
          role="tablist"
          aria-label="Fase do preparo"
        >
          <button
            type="button"
            role="tab"
            aria-selected={phase === "ingredientes"}
            onClick={() => setPhase("ingredientes")}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              phase === "ingredientes"
                ? "bg-accent text-white"
                : "text-muted hover:bg-accent-soft/40"
            }`}
          >
            Ingredientes
            <span className="ml-1 opacity-80">
              {ingredientsDone}/{ingredientsTotal}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={phase === "passos"}
            onClick={() => setPhase("passos")}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              phase === "passos" ? "bg-accent text-white" : "text-muted hover:bg-accent-soft/40"
            }`}
          >
            Passos
            <span className="ml-1 opacity-80">
              {stepsDone}/{stepsTotal}
            </span>
          </button>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {phase === "ingredientes" ? (
          <>
            {allIngredientsChecked && stepsTotal > 0 ? (
              <div className="rounded-2xl border border-accent/30 bg-accent-soft/30 px-4 py-3">
                <p className="text-sm font-medium text-accent">
                  Todos os ingredientes separados — siga para os passos.
                </p>
                <button
                  type="button"
                  onClick={() => setPhase("passos")}
                  className="mt-2 text-sm font-semibold text-accent underline-offset-2 hover:underline"
                >
                  Ir para o modo de preparo →
                </button>
              </div>
            ) : null}

            {ingredientGroups.map(([groupLabel, items]) => (
              <section key={groupLabel} className="space-y-3">
                <h2 className={`text-xs font-semibold uppercase tracking-[0.12em] ${visual.label}`}>
                  {groupLabel}
                </h2>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const checked = checkedIngredients.includes(item.id)
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleToggleIngredient(item.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              handleToggleIngredient(item.id)
                            }
                          }}
                          className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                            checked
                              ? "border-accent/30 bg-accent-soft/25"
                              : "border-border/70 bg-surface hover:border-accent/30"
                          }`}
                          aria-pressed={checked}
                          aria-label={`Marcar ingrediente ${item.name}`}
                          tabIndex={0}
                        >
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                              checked
                                ? "border-accent bg-accent text-white"
                                : "border-border"
                            }`}
                          >
                            {checked ? <IconCheck className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span
                            className={`text-sm leading-relaxed ${
                              checked ? "text-muted line-through" : "font-medium"
                            }`}
                          >
                            {formatIngredientLine(item)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </>
        ) : null}

        {phase === "passos" ? (
          <>
            {activeStep ? (
              <section className="rounded-2xl border border-border/70 bg-surface p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {activeStepIndex + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Passo atual
                      </p>
                      <p className="text-sm font-semibold">
                        {activeStepIndex + 1} de {stepsTotal}
                      </p>
                    </div>
                  </div>

                  {activeStep.timerMinutes ? (
                    <div className="flex items-center gap-2">
                      {timerSeconds !== null && timerSeconds > 0 ? (
                        <span className="rounded-full bg-accent px-3 py-1.5 font-mono text-sm font-semibold text-white">
                          {formatTimer(timerSeconds)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartTimer(activeStep.timerMinutes!)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-accent-soft/40"
                        >
                          Timer {activeStep.timerMinutes} min
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                <p className="mt-5 text-base leading-relaxed md:text-lg">
                  {activeStep.instruction}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkStepDone(activeStep.id)}
                    disabled={checkedSteps.includes(activeStep.id)}
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
                  >
                    {checkedSteps.includes(activeStep.id) ? "Passo concluído" : "Marcar como feito"}
                  </button>
                  {activeStepIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex((index) => index - 1)}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent-soft/40"
                    >
                      Passo anterior
                    </button>
                  ) : null}
                  {activeStepIndex < stepsTotal - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex((index) => index + 1)}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent-soft/40"
                    >
                      Próximo passo
                    </button>
                  ) : null}
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
                <p className="text-sm text-muted">Nenhum passo cadastrado nesta receita</p>
              </div>
            )}

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted">Todos os passos</h2>
              <ol className="space-y-2">
                {recipe.steps.map((step, index) => {
                  const checked = checkedSteps.includes(step.id)
                  const isCurrent = index === activeStepIndex

                  return (
                    <li key={step.id}>
                      <div
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 transition ${
                          isCurrent
                            ? "border-accent/40 bg-accent-soft/20"
                            : checked
                              ? "border-border/60 bg-background/40"
                              : "border-border/70 bg-surface"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveStepIndex(index)}
                          className="min-w-0 flex-1 text-left"
                          aria-label={`Ir para passo ${index + 1}`}
                          tabIndex={0}
                        >
                          <span className="flex items-start gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                checked
                                  ? "bg-accent text-white"
                                  : isCurrent
                                    ? "bg-accent-soft text-accent ring-2 ring-accent/30"
                                    : "bg-background text-muted ring-1 ring-border"
                              }`}
                            >
                              {checked ? <IconCheck className="h-3.5 w-3.5" /> : index + 1}
                            </span>
                            <span className="min-w-0">
                              <span
                                className={`block text-sm leading-relaxed ${
                                  checked ? "text-muted line-through" : ""
                                }`}
                              >
                                {step.instruction}
                              </span>
                              {step.timerMinutes ? (
                                <span className="mt-1 inline-block text-xs text-muted">
                                  Timer: {step.timerMinutes} min
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStep(step.id)}
                          className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-semibold transition ${
                            checked
                              ? "border-accent/30 text-accent"
                              : "border-border text-muted hover:bg-accent-soft/40"
                          }`}
                          aria-pressed={checked}
                          aria-label={`Marcar passo ${index + 1} como feito`}
                          tabIndex={0}
                        >
                          {checked ? "Feito" : "Marcar"}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          </>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleAbandon}
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent-soft/40"
          >
            Abandonar
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {phase === "ingredientes" && allIngredientsChecked && stepsTotal > 0 ? (
              <button
                type="button"
                onClick={() => setPhase("passos")}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent-soft/40"
              >
                Ir para passos
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleting}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {isCompleting
                ? "Concluindo..."
                : allStepsChecked
                  ? "Concluir preparo"
                  : `Concluir (${stepsDone}/${stepsTotal} passos)`}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
