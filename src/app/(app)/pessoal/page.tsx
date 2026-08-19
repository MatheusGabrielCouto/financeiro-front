import Link from "next/link"
import { redirect } from "next/navigation"
import {
  IconCheck,
  IconFlame,
  IconJournal,
  IconPill,
  IconRoutine,
  IconStudy,
  IconTarget,
  IconWarning,
} from "@/components/icons"
import { ModuleCard } from "@/components/module-card"
import { ApiError } from "@/lib/api-server"
import { getStoredUser } from "@/lib/auth-cookies"
import { formatDate, formatMonthLabel, getCurrentMonthYear } from "@/lib/format"
import {
  getJournalEntries,
  getMedicines,
  getNotebooks,
  getPersonalGoals,
  getRecipes,
  getRoutineOverview,
  getStudySubjects,
  getTodayRoutines,
} from "@/lib/finance-api"
import { htmlToPlainText } from "@/lib/html-text"
import { getMoodOption } from "@/lib/journal-mood"
import {
  compareMedicineUrgency,
  formatExpiration,
  medicineStatusClasses,
  medicineStatusLabel,
} from "@/lib/medicine-status"
import { findModuleById, findNavItem } from "@/lib/nav-registry"
import { getNotebookColorTokens } from "@/lib/notebook-colors"
import { getRoutineColor } from "@/lib/routine-colors"

const cadernosModule = findModuleById("cadernos")!
const estudosModule = findModuleById("estudos")!
const remediosModule = findModuleById("remedios")!
const rotinasModule = findModuleById("rotinas")!
const diarioModule = findModuleById("diario")!
const metasPessoaisModule = findModuleById("metas-pessoais")!
const receitasModule = findModuleById("receitas")!

const loadPersonalHubData = async () => {
  const { month, year } = getCurrentMonthYear()

  const [
    user,
    studySubjects,
    notebooks,
    medicines,
    todayRoutines,
    routineOverview,
    journalEntries,
    personalGoals,
    recipes,
  ] = await Promise.all([
    getStoredUser(),
    getStudySubjects().catch(() => []),
    getNotebooks().catch(() => []),
    getMedicines().catch(() => []),
    getTodayRoutines().catch(() => []),
    getRoutineOverview(month, year).catch(() => null),
    getJournalEntries(month, year).catch(() => []),
    getPersonalGoals().catch(() => []),
    getRecipes().catch(() => []),
  ])

  const activeStudySubjects = studySubjects.filter((subject) => !subject.archivedAt)
  const studyWeekMinutes = activeStudySubjects.reduce(
    (sum, subject) => sum + subject.weekMinutes,
    0
  )
  const studyGoalMinutes = activeStudySubjects.reduce(
    (sum, subject) => sum + subject.weeklyGoalHours * 60,
    0
  )
  const studyProgress =
    studyGoalMinutes > 0
      ? Math.min(100, Math.round((studyWeekMinutes / studyGoalMinutes) * 100))
      : 0
  const topStudySubjects = [...activeStudySubjects]
    .sort((a, b) => b.weekProgressPct - a.weekProgressPct)
    .slice(0, 3)

  const expiredMedicinesCount = medicines.filter(
    (item) => item.status === "expired"
  ).length
  const expiringSoonMedicinesCount = medicines.filter(
    (item) => item.status === "expiring_soon"
  ).length
  const lowStockMedicinesCount = medicines.filter((item) => item.isLowStock).length
  const attentionMedicines = [...medicines]
    .sort(compareMedicineUrgency)
    .slice(0, 3)

  const recentNotebooks = [...notebooks]
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4)
  const notebookPageTotal = notebooks.reduce(
    (sum, notebook) => sum + notebook.pageCount,
    0
  )

  const doneTodayCount = todayRoutines.filter((item) => item.checkedToday).length
  const totalTodayCount = todayRoutines.length
  const pendingTodayCount = totalTodayCount - doneTodayCount
  const routineProgress =
    totalTodayCount > 0
      ? Math.round((doneTodayCount / totalTodayCount) * 100)
      : 0
  const bestCurrentStreak = routineOverview?.bestCurrentStreak ?? 0
  const previewRoutines = todayRoutines.slice(0, 3)
  const streakById = new Map(
    (routineOverview?.routines ?? []).map((item) => [item.id, item.currentStreak])
  )

  const journalEntryCount = journalEntries.length
  const moodCounts = journalEntries.reduce<Record<number, number>>((acc, entry) => {
    if (entry.mood != null) acc[entry.mood] = (acc[entry.mood] ?? 0) + 1
    return acc
  }, {})
  const bestMoodValue = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestMood = bestMoodValue != null ? getMoodOption(Number(bestMoodValue)) : null
  const latestEntry =
    [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0] ?? null

  const activeGoals = personalGoals.filter((goal) => !goal.archivedAt)
  const avgGoalsProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, goal) => sum + goal.progressPct, 0) /
            activeGoals.length
        )
      : 0
  const completedGoalsCount = activeGoals.filter(
    (goal) => goal.progressPct >= 100
  ).length
  const topGoals = [...activeGoals]
    .sort((a, b) => b.progressPct - a.progressPct)
    .slice(0, 3)

  const medicineAttentionCount =
    expiredMedicinesCount + expiringSoonMedicinesCount + lowStockMedicinesCount
  const attentionCount = medicineAttentionCount + pendingTodayCount

  const topRecipes = [...recipes]
    .sort((a, b) => b.timesCooked - a.timesCooked || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
  const totalRecipesCooked = recipes.reduce((sum, recipe) => sum + recipe.timesCooked, 0)

  const firstName = user?.name?.split(" ")[0] ?? "olá"
  const monthLabel = formatMonthLabel(month, year)

  return {
    monthLabel,
    firstName,
    studyWeekMinutes,
    studyGoalMinutes,
    studyProgress,
    topStudySubjects,
    totalMedicines: medicines.length,
    expiredMedicinesCount,
    expiringSoonMedicinesCount,
    lowStockMedicinesCount,
    attentionMedicines,
    recentNotebooks,
    notebookPageTotal,
    doneTodayCount,
    totalTodayCount,
    pendingTodayCount,
    routineProgress,
    bestCurrentStreak,
    previewRoutines,
    streakById,
    journalEntryCount,
    bestMood,
    latestEntry,
    activeGoalsCount: activeGoals.length,
    avgGoalsProgress,
    completedGoalsCount,
    topGoals,
    attentionCount,
    medicineAttentionCount,
    recipes,
    topRecipes,
    totalRecipesCooked,
  }
}

const PessoalPage = async () => {
  let personal: Awaited<ReturnType<typeof loadPersonalHubData>>
  try {
    personal = await loadPersonalHubData()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    throw error
  }

  const {
    monthLabel,
    firstName,
    studyWeekMinutes,
    studyGoalMinutes,
    studyProgress,
    topStudySubjects,
    totalMedicines,
    expiredMedicinesCount,
    expiringSoonMedicinesCount,
    lowStockMedicinesCount,
    attentionMedicines,
    recentNotebooks,
    notebookPageTotal,
    doneTodayCount,
    totalTodayCount,
    pendingTodayCount,
    routineProgress,
    bestCurrentStreak,
    previewRoutines,
    streakById,
    journalEntryCount,
    bestMood,
    latestEntry,
    activeGoalsCount,
    avgGoalsProgress,
    completedGoalsCount,
    topGoals,
    attentionCount,
    medicineAttentionCount,
    recipes,
    topRecipes,
    totalRecipesCooked,
  } = personal

  const routinesComplete = totalTodayCount > 0 && pendingTodayCount === 0

  return (
    <div className="space-y-6">
      <section
        className="dashboard-enter overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-[0_14px_38px_rgba(17,24,39,0.08)] dark:shadow-[0_18px_42px_rgba(2,6,23,0.46)]"
        style={{ animationDelay: "0ms" }}
      >
        <div className="relative bg-gradient-to-br from-rose-950 via-orange-950 to-amber-950 px-5 py-6 text-white md:px-7 md:py-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-rose-400/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-amber-300/10 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200/90">
                {monthLabel}
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
                Olá, {firstName}
              </h1>
              <p className="mt-2 text-sm text-rose-100/80">
                Seu hub pessoal — rotinas, estudos, diário, metas e muito mais.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/pessoal/rotinas"
                className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                <IconRoutine className="h-4 w-4" />
                Rotinas de hoje
              </Link>
              <Link
                href="/pessoal/diario"
                className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                <IconJournal className="h-4 w-4" />
                Escrever no diário
              </Link>
            </div>
          </div>

          <div className="relative mt-7 grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm text-rose-100/80">Rotinas de hoje</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
                {doneTodayCount}
                <span className="text-2xl text-rose-200/70 md:text-3xl">
                  {" "}
                  / {totalTodayCount}
                </span>
              </p>
              <p
                className={`mt-3 text-sm font-medium ${
                  totalTodayCount === 0
                    ? "text-rose-200/70"
                    : routinesComplete
                      ? "text-emerald-300"
                      : "text-amber-300"
                }`}
              >
                {totalTodayCount === 0
                  ? "Nenhuma rotina agendada para hoje"
                  : routinesComplete
                    ? "Todas as rotinas de hoje concluídas"
                    : `${pendingTodayCount} rotina(s) ainda pendente(s)`}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-rose-100/80">Progresso do dia</p>
                <span className="text-sm font-semibold text-amber-200">
                  {routineProgress}%
                </span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-300 transition-all"
                  style={{ width: `${routineProgress}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-rose-200/70">Sequência</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-emerald-300">
                    {bestCurrentStreak > 0 ? (
                      <>
                        <IconFlame className="h-3.5 w-3.5" />
                        {bestCurrentStreak} dia(s)
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-rose-200/70">Notas no mês</p>
                  <p className="mt-0.5 font-semibold text-amber-200">
                    {journalEntryCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {attentionCount > 0 ? (
        <section
          className="dashboard-enter rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30 md:p-5"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-warning">
                {attentionCount === 1
                  ? "1 item pedindo atenção"
                  : `${attentionCount} itens pedindo atenção`}
              </p>
              <p className="mt-1 text-sm text-muted">
                {pendingTodayCount > 0 && medicineAttentionCount > 0
                  ? "Rotinas pendentes e remédios com alerta."
                  : pendingTodayCount > 0
                    ? "Rotinas de hoje ainda não concluídas."
                    : "Remédios vencidos, vencendo ou com estoque baixo."}
              </p>
            </div>
            <Link
              href={
                medicineAttentionCount > 0 ? "/pessoal/remedios" : "/pessoal/rotinas"
              }
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              aria-label="Ver itens que pedem atenção"
            >
              Ver atenção
            </Link>
          </div>
        </section>
      ) : null}

      <section
        className="dashboard-enter grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores pessoais"
        style={{ animationDelay: "100ms" }}
      >
        {[
          {
            label: "Rotinas hoje",
            value: `${doneTodayCount}/${totalTodayCount}`,
            hint:
              totalTodayCount === 0
                ? "Nenhuma agendada"
                : routinesComplete
                  ? "Tudo feito"
                  : `${pendingTodayCount} pendente(s)`,
            className: routinesComplete
              ? "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/30"
              : pendingTodayCount > 0
                ? "border-amber-200/70 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/30"
                : "border-border/80 bg-surface",
            valueClass: routinesComplete
              ? "text-success"
              : pendingTodayCount > 0
                ? "text-warning"
                : "text-foreground",
            icon: routinesComplete ? IconCheck : IconRoutine,
            iconClass: routinesComplete
              ? "bg-emerald-100 text-success dark:bg-emerald-900/40"
              : "bg-violet-100 text-accent dark:bg-violet-900/40",
          },
          {
            label: "Estudos",
            value: `${(studyWeekMinutes / 60).toFixed(1)}h`,
            hint:
              studyGoalMinutes > 0
                ? `${studyProgress}% da meta semanal`
                : "Sem meta definida",
            className:
              "border-sky-200/70 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/30",
            valueClass: "text-sky-600 dark:text-sky-300",
            icon: IconStudy,
            iconClass: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
          },
          {
            label: "Diário",
            value: String(journalEntryCount),
            hint: bestMood ? `Humor: ${bestMood.label}` : "Notas este mês",
            className:
              "border-indigo-200/70 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/30",
            valueClass: "text-indigo-600 dark:text-indigo-300",
            icon: IconJournal,
            iconClass:
              "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300",
          },
          {
            label: "Remédios",
            value: String(totalMedicines),
            hint:
              medicineAttentionCount > 0
                ? `${medicineAttentionCount} com alerta`
                : "Tudo em dia",
            className:
              medicineAttentionCount > 0
                ? "border-rose-200/70 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/30"
                : "border-border/80 bg-surface",
            valueClass:
              medicineAttentionCount > 0 ? "text-danger" : "text-foreground",
            icon: medicineAttentionCount > 0 ? IconWarning : IconPill,
            iconClass:
              medicineAttentionCount > 0
                ? "bg-rose-100 text-danger dark:bg-rose-900/40"
                : "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
          },
        ].map((card) => (
          <article
            key={card.label}
            className={`interactive-lift rounded-2xl border p-4 shadow-sm shadow-slate-200/30 md:p-5 ${card.className}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted">{card.label}</p>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
              >
                <card.icon className="h-4 w-4" />
              </span>
            </div>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight ${card.valueClass}`}
            >
              {card.value}
            </p>
            <p className="mt-1.5 text-xs text-muted">{card.hint}</p>
          </article>
        ))}
      </section>

      <section
        className="dashboard-enter grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        style={{ animationDelay: "140ms" }}
      >
        <ModuleCard module={cadernosModule} actionLabel="Ver cadernos">
          {recentNotebooks.length === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhum caderno ainda</p>
              <Link
                href="/pessoal/cadernos"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Criar caderno
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                {notebookPageTotal} página(s) em{" "}
                {recentNotebooks.length === 1
                  ? "1 caderno"
                  : `${recentNotebooks.length > 4 ? "4+" : recentNotebooks.length} cadernos`}
              </p>
              {recentNotebooks.slice(0, 3).map((notebook) => {
                const tokens = getNotebookColorTokens(notebook.color)
                return (
                  <Link
                    key={notebook.id}
                    href={`/pessoal/cadernos?notebook=${notebook.id}`}
                    aria-label={`Abrir caderno ${notebook.title}`}
                    className="interactive-lift panel-soft flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:border-accent/30 hover:bg-accent-soft/40"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${tokens.bg} ${tokens.text}`}
                      aria-hidden="true"
                    >
                      {notebook.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {notebook.title}
                      </span>
                      <span className="block text-xs text-muted">
                        {notebook.pageCount === 1
                          ? "1 página"
                          : `${notebook.pageCount} páginas`}{" "}
                        · {formatDate(notebook.updatedAt)}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </ModuleCard>

        <ModuleCard module={estudosModule}>
          {topStudySubjects.length === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhuma matéria ainda</p>
              <Link
                href="/pessoal/estudos"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Criar matéria
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {(studyWeekMinutes / 60).toFixed(1)}h de{" "}
                  {(studyGoalMinutes / 60).toFixed(1)}h
                </span>
                <span className="font-semibold text-sky-600 dark:text-sky-300">
                  {studyProgress}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${studyProgress}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {topStudySubjects.map((subject) => (
                  <li key={subject.id} className="panel-soft rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{subject.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {subject.weekProgressPct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-sky-400"
                        style={{ width: `${subject.weekProgressPct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ModuleCard>

        <ModuleCard module={remediosModule}>
          {totalMedicines === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhum remédio cadastrado</p>
              <Link
                href="/pessoal/remedios"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Cadastrar remédio
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="panel-soft rounded-xl px-2 py-2.5">
                  <p className="text-lg font-semibold">{totalMedicines}</p>
                  <p className="text-xs text-muted">Cadastrados</p>
                </div>
                <div className="rounded-xl border border-rose-200/70 bg-rose-50 px-2 py-2.5 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <p className="text-lg font-semibold text-danger">
                    {expiredMedicinesCount}
                  </p>
                  <p className="text-xs text-muted">Vencidos</p>
                </div>
                <div className="rounded-xl border border-amber-200/70 bg-amber-50 px-2 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <p className="text-lg font-semibold text-warning">
                    {expiringSoonMedicinesCount}
                  </p>
                  <p className="text-xs text-muted">Vencendo</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {attentionMedicines.map((medicine) => (
                  <li key={medicine.id} className="panel-soft rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{medicine.name}</span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${medicineStatusClasses(medicine.status)}`}
                      >
                        {medicineStatusLabel(medicine.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {medicine.quantity} {medicine.unit} · validade{" "}
                      {formatExpiration(medicine.expirationMonth, medicine.expirationYear)}
                    </p>
                  </li>
                ))}
              </ul>
              {lowStockMedicinesCount > 0 ? (
                <p className="mt-3 text-xs text-muted">
                  {lowStockMedicinesCount} com estoque baixo
                </p>
              ) : null}
            </>
          )}
        </ModuleCard>

        <ModuleCard module={rotinasModule}>
          {totalTodayCount === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhuma rotina pra hoje</p>
              <Link
                href="/pessoal/rotinas"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Criar rotina
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {doneTodayCount} de {totalTodayCount} feitas hoje
                </span>
                {bestCurrentStreak > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-300">
                    <IconFlame className="h-3.5 w-3.5" />
                    {bestCurrentStreak}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${totalTodayCount > 0 ? (doneTodayCount / totalTodayCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {previewRoutines.map((routine) => {
                  const colors = getRoutineColor(routine.color)
                  const streak = streakById.get(routine.id) ?? 0
                  return (
                    <li
                      key={routine.id}
                      className="panel-soft flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`}
                          aria-hidden="true"
                        />
                        <span className="truncate font-medium">{routine.title}</span>
                      </span>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          routine.checkedToday
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-muted"
                        }`}
                      >
                        {routine.checkedToday
                          ? "Feito"
                          : streak > 0
                            ? `${streak} dia(s)`
                            : "Pendente"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </ModuleCard>

        <ModuleCard module={diarioModule}>
          {journalEntryCount === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhuma nota este mês</p>
              <Link
                href="/pessoal/diario"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Escrever no diário
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {journalEntryCount} nota(s) este mês
                </span>
                {bestMood ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-300">
                    <span aria-hidden="true">{bestMood.emoji}</span>
                    {bestMood.label}
                  </span>
                ) : null}
              </div>
              {latestEntry ? (
                <div className="panel-soft mt-4 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted">
                    <span>{formatDate(latestEntry.date)}</span>
                    {getMoodOption(latestEntry.mood) ? (
                      <span aria-hidden="true">
                        {getMoodOption(latestEntry.mood)?.emoji}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm">
                    {htmlToPlainText(latestEntry.content)}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </ModuleCard>

        <ModuleCard module={metasPessoaisModule}>
          {activeGoalsCount === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhuma meta ainda</p>
              <Link
                href="/pessoal/metas-pessoais"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Criar meta
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{activeGoalsCount} meta(s) ativa(s)</span>
                <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                  {avgGoalsProgress}% média
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {topGoals.map((goal) => (
                  <li key={goal.id} className="panel-soft rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{goal.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-fuchsia-500"
                        style={{ width: `${Math.min(100, goal.progressPct)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {completedGoalsCount > 0 ? (
                <p className="mt-3 text-xs text-muted">
                  {completedGoalsCount} concluída(s)
                </p>
              ) : null}
            </>
          )}
        </ModuleCard>

        <ModuleCard module={receitasModule} actionLabel="Ver receitas">
          {topRecipes.length === 0 ? (
            <div className="panel-soft rounded-xl px-4 py-6 text-center">
              <p className="text-sm font-medium">Nenhuma receita ainda</p>
              <Link
                href="/pessoal/receitas/nova"
                className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Criar receita
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                {recipes.length} receita(s) · {totalRecipesCooked} preparo(s) concluído(s)
              </p>
              <ul className="space-y-2">
                {topRecipes.map((recipe) => (
                  <li key={recipe.id}>
                    <Link
                      href={`/pessoal/receitas/${recipe.id}`}
                      className="interactive-lift panel-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <span className="truncate font-medium">{recipe.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {recipe.timesCooked > 0 ? `${recipe.timesCooked}x` : "Nova"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ModuleCard>
      </section>

      <section
        className="dashboard-enter panel p-5 md:p-6"
        style={{ animationDelay: "180ms" }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
          Ações rápidas
        </h2>
        <p className="mt-1 text-sm text-muted">
          Atalhos para os módulos que você mais usa no dia a dia
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/pessoal/rotinas", hint: "Check-in diário" },
            { href: "/pessoal/diario", hint: "Registrar o dia" },
            { href: "/pessoal/estudos", hint: "Sessões e metas" },
            { href: "/pessoal/cadernos", hint: "Anotações livres" },
            { href: "/pessoal/metas-pessoais", hint: "Progresso pessoal" },
            { href: "/pessoal/receitas", hint: "Livro e modo preparo" },
            { href: "/pessoal/remedios", hint: "Doses e validade" },
          ].map((action) => {
            const navItem = findNavItem(action.href)
            const Icon = navItem?.icon ?? IconTarget
            return (
              <Link
                key={action.href}
                href={action.href}
                className="interactive-lift group flex items-center gap-3 rounded-xl border border-border/80 bg-background/50 px-3 py-3 transition hover:border-accent/30 hover:bg-accent-soft/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-accent group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {navItem?.label ?? action.href}
                  </span>
                  <span className="block text-xs text-muted">{action.hint}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default PessoalPage
