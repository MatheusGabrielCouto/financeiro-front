import { formatDate } from "@/lib/format"
import type { RecipeCookHistoryItem } from "@/lib/types"

type RecipeHistoryListProps = {
  history: RecipeCookHistoryItem[]
}

export const RecipeHistoryList = ({ history }: RecipeHistoryListProps) => {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted">Você ainda não concluiu esta receita no modo preparo</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {history.map((item, index) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm"
        >
          <span className="font-semibold">Preparo #{history.length - index}</span>
          <span className="text-muted">{formatDate(item.completedAt)}</span>
          {item.durationMinutes ? (
            <span className="rounded-full bg-accent-soft/60 px-2.5 py-0.5 text-xs font-medium text-accent">
              {item.durationMinutes} min
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
