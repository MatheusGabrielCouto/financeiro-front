import type { RecipeStep } from "@/lib/types"

type RecipeStepsPanelProps = {
  steps: RecipeStep[]
}

export const RecipeStepsPanel = ({ steps }: RecipeStepsPanelProps) => {
  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted">Nenhum passo cadastrado</p>
      </div>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="preparo-heading">
      <div>
        <h2
          id="preparo"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
        >
          Modo de preparo
        </h2>
        <p className="mt-1 text-sm text-muted">
          {steps.length} passo{steps.length === 1 ? "" : "s"}
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex gap-4 rounded-2xl border border-border/70 bg-surface p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">Passo {index + 1}</p>
                {step.timerMinutes ? (
                  <span className="rounded-full bg-accent-soft/70 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {step.timerMinutes} min
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {step.instruction}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
