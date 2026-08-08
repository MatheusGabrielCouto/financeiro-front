import { IconTarget } from "@/components/icons"
import { PersonalGoalIncrementForm } from "@/components/personal-goal-increment-form"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { formatDateKey } from "@/lib/format"
import type { PersonalGoal, PersonalGoalEntry } from "@/lib/types"

type PersonalGoalCardProps = {
  goal: PersonalGoal
  recentEntries: PersonalGoalEntry[]
}

export const PersonalGoalCard = ({ goal, recentEntries }: PersonalGoalCardProps) => {
  const isArchived = Boolean(goal.archivedAt)
  const isComplete = goal.progressPct >= 100

  return (
    <li
      className={`rounded-2xl border p-4 ${
        isArchived ? "border-border/60 opacity-70" : "border-border/80"
      } ${isComplete ? "bg-emerald-50/60 dark:bg-emerald-500/5" : "bg-surface"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isComplete ? "bg-emerald-500 text-white" : "bg-accent-soft text-accent"
            }`}
          >
            <IconTarget className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{goal.title}</p>
            <p className="text-xs text-muted">
              {goal.current} / {goal.target} {goal.unit}
              {isComplete ? " · concluída" : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isArchived ? (
            <ProxyActionButton
              path={`/personal-goal/${goal.id}/restore`}
              method="POST"
              label="Reativar"
              loadingLabel="Reativando..."
              variant="ghost"
              ariaLabel={`Reativar meta ${goal.title}`}
            />
          ) : (
            <ProxyActionButton
              path={`/personal-goal/${goal.id}/archive`}
              method="POST"
              label="Pausar"
              loadingLabel="Pausando..."
              variant="ghost"
              ariaLabel={`Pausar meta ${goal.title}`}
            />
          )}
          <ProxyActionButton
            path={`/personal-goal/${goal.id}`}
            method="DELETE"
            label="Excluir"
            loadingLabel="Excluindo..."
            confirmTitle="Excluir meta"
            confirmMessage={`Excluir "${goal.title}" e todo o histórico?`}
            variant="danger"
            ariaLabel={`Excluir meta ${goal.title}`}
          />
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <div
          className={`h-full rounded-full ${
            isComplete ? "bg-emerald-500" : "bg-accent"
          }`}
          style={{ width: `${Math.min(goal.progressPct, 100)}%` }}
        />
      </div>

      {!isArchived ? (
        <div className="mt-3">
          <PersonalGoalIncrementForm goalId={goal.id} unit={goal.unit} />
        </div>
      ) : null}

      {recentEntries.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-border/60 pt-3">
          {recentEntries.map((entry) => (
            <li key={entry.id} className="flex justify-between text-xs text-muted">
              <span>{formatDateKey(entry.date)}</span>
              <span>
                {entry.amount > 0 ? "+" : ""}
                {entry.amount} {goal.unit}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
