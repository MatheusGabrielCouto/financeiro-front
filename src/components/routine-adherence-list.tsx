import { IconFlame } from "@/components/icons"
import { getRoutineColor } from "@/lib/routine-colors"
import type { RoutineOverviewItem } from "@/lib/types"

type RoutineAdherenceListProps = {
  routines: RoutineOverviewItem[]
}

export const RoutineAdherenceList = ({ routines }: RoutineAdherenceListProps) => {
  if (routines.length === 0) {
    return (
      <div className="rounded-xl bg-background px-4 py-12 text-center">
        <p className="font-medium">Sem rotinas neste mês</p>
        <p className="mt-1 text-sm text-muted">
          Crie uma rotina para ver a adesão aqui.
        </p>
      </div>
    )
  }

  const sorted = [...routines].sort((a, b) => b.adherencePct - a.adherencePct)

  return (
    <ul className="space-y-4">
      {sorted.map((item) => {
        const palette = getRoutineColor(item.color)

        return (
          <li key={item.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${palette.dot}`} />
                <span className="truncate">{item.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5">
                {item.currentStreak > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold text-warning"
                    title={`Sequência atual: ${item.currentStreak} dia(s)`}
                  >
                    <IconFlame className="h-3.5 w-3.5" />
                    {item.currentStreak}
                  </span>
                ) : null}
                <span className="font-semibold tabular-nums text-foreground">
                  {item.adherencePct}%
                </span>
              </span>
            </div>

            <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${palette.track}`}>
              <div
                className={`h-full rounded-full ${palette.dot} transition-all`}
                style={{ width: `${Math.max(item.adherencePct, item.completedDays > 0 ? 3 : 0)}%` }}
              />
            </div>

            <p className="mt-1 text-xs text-muted">
              {item.completedDays} de {item.expectedDays} dia(s) esperado(s)
            </p>
          </li>
        )
      })}
    </ul>
  )
}
