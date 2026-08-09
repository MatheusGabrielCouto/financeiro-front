import { IconStudy } from "@/components/icons"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { StudySessionForm } from "@/components/study-session-form"
import { getRoutineColor } from "@/lib/routine-colors"
import { formatDateKey } from "@/lib/format"
import { getStudySkillLabel } from "@/lib/study-skills"
import type { StudySession, StudySubject } from "@/lib/types"

type StudySubjectCardProps = {
  subject: StudySubject
  sessions: StudySession[]
}

export const StudySubjectCard = ({ subject, sessions }: StudySubjectCardProps) => {
  const isArchived = Boolean(subject.archivedAt)
  const isComplete = subject.weekProgressPct >= 100
  const palette = getRoutineColor(subject.color)
  const weekHours = (subject.weekMinutes / 60).toFixed(1)
  const recentSessions = sessions.slice(0, 3)

  const skillBreakdown = Object.entries(
    sessions.reduce<Record<string, number>>((acc, session) => {
      if (!session.skill) return acc
      acc[session.skill] = (acc[session.skill] ?? 0) + session.durationMinutes
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <li
      className={`rounded-2xl border p-4 ${
        isArchived ? "border-border/60 opacity-70" : "border-border/80"
      } ${isComplete ? "bg-emerald-50/60 dark:bg-emerald-500/5" : "bg-surface"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.from} ${palette.to} text-white`}
          >
            <IconStudy className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{subject.title}</p>
            <p className="text-xs text-muted">
              {weekHours}h / {subject.weeklyGoalHours}h esta semana
              {isComplete ? " · meta batida" : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isArchived ? (
            <ProxyActionButton
              path={`/study-subject/${subject.id}/restore`}
              method="POST"
              label="Reativar"
              loadingLabel="Reativando..."
              variant="ghost"
              ariaLabel={`Reativar matéria ${subject.title}`}
            />
          ) : (
            <ProxyActionButton
              path={`/study-subject/${subject.id}/archive`}
              method="POST"
              label="Pausar"
              loadingLabel="Pausando..."
              variant="ghost"
              ariaLabel={`Pausar matéria ${subject.title}`}
            />
          )}
          <ProxyActionButton
            path={`/study-subject/${subject.id}`}
            method="DELETE"
            label="Excluir"
            loadingLabel="Excluindo..."
            confirmTitle="Excluir matéria"
            confirmMessage={`Excluir "${subject.title}" e todo o histórico de sessões?`}
            variant="danger"
            ariaLabel={`Excluir matéria ${subject.title}`}
          />
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <div
          className={`h-full rounded-full ${
            isComplete ? "bg-emerald-500" : "bg-accent"
          }`}
          style={{ width: `${Math.min(subject.weekProgressPct, 100)}%` }}
        />
      </div>

      {!isArchived ? (
        <div className="mt-3">
          <StudySessionForm subjectId={subject.id} compact />
        </div>
      ) : null}

      {skillBreakdown.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {skillBreakdown.map(([skill, minutes]) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300"
            >
              {getStudySkillLabel(skill)} · {minutes}min
            </span>
          ))}
        </div>
      ) : null}

      {recentSessions.length > 0 ? (
        <ul
          className={`space-y-1 pt-3 ${skillBreakdown.length > 0 ? "" : "border-t border-border/60"} mt-3`}
        >
          {recentSessions.map((session) => (
            <li key={session.id} className="flex justify-between gap-2 text-xs text-muted">
              <span className="truncate">
                {formatDateKey(session.date)}
                {session.skill ? ` · ${getStudySkillLabel(session.skill)}` : ""}
                {session.topic ? ` · ${session.topic}` : ""}
              </span>
              <span className="shrink-0">{session.durationMinutes} min</span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
