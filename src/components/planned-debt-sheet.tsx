"use client"

import Link from "next/link"
import {
  ChangeEvent,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { IconCheck, IconChevron, IconPlus, IconTrash } from "@/components/icons"
import { formatCurrency, parseCurrencyInput } from "@/lib/format"
import type { PlannedDebtLine, PlannedDebtWorkbook } from "@/lib/types"

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

const COL = {
  select: "w-10 min-w-10",
  index: "w-10 min-w-10",
  title: "w-[13rem] min-w-[13rem]",
  label: "w-[18rem] min-w-[18rem]",
  month: "min-w-[6.75rem] w-[6.75rem]",
  total: "min-w-[7rem] w-[7rem]",
  actions: "min-w-[5.75rem] w-[5.75rem]",
}

const TABLE_MIN_WIDTH = "min-w-[1320px]"

const checkboxClass =
  "h-3.5 w-3.5 cursor-pointer rounded border-border accent-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

type PendingDelete =
  | { mode: "single"; id: string; title: string }
  | { mode: "bulk"; ids: string[] }

type PlannedDebtSheetProps = {
  initialWorkbook: PlannedDebtWorkbook
}

type SheetCurrencyCellProps = {
  value: number
  disabled?: boolean
  ariaLabel: string
  highlight?: boolean
  onCommit: (value: number) => void
}

const SheetCurrencyCell = ({
  value,
  disabled = false,
  ariaLabel,
  highlight = false,
  onCommit,
}: SheetCurrencyCellProps) => {
  const [display, setDisplay] = useState(value > 0 ? formatCurrency(value) : "")
  const [amount, setAmount] = useState(value)

  useEffect(() => {
    setDisplay(value > 0 ? formatCurrency(value) : "")
    setAmount(value)
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "")

    if (!digits) {
      setDisplay("")
      setAmount(0)
      return
    }

    const next = parseCurrencyInput(digits)
    setDisplay(formatCurrency(next))
    setAmount(next)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      value={display}
      onChange={handleChange}
      onBlur={() => onCommit(amount)}
      placeholder="—"
      aria-label={ariaLabel}
      className={`w-full rounded-md border border-transparent bg-transparent px-1.5 py-2 text-right text-[13px] tabular-nums outline-none transition placeholder:text-slate-300 focus:border-accent/40 focus:bg-white focus:shadow-[inset_0_0_0_1px_rgba(15,118,110,0.25)] disabled:opacity-60 dark:placeholder:text-slate-600 dark:focus:bg-slate-900 ${
        highlight ? "bg-teal-50/50 dark:bg-teal-950/30" : ""
      }`}
    />
  )
}

export const PlannedDebtSheet = ({
  initialWorkbook,
}: PlannedDebtSheetProps) => {
  const router = useRouter()
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const footerScrollRef = useRef<HTMLDivElement>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)
  const [workbook, setWorkbook] = useState(initialWorkbook)
  const [newTitle, setNewTitle] = useState("")
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setWorkbook(initialWorkbook)
  }, [initialWorkbook])

  useEffect(() => {
    const validIds = new Set(
      workbook.lines.filter((line) => !line.locked).map((line) => line.id)
    )
    setSelectedIds((current) => current.filter((id) => validIds.has(id)))
  }, [workbook.lines])

  const year = workbook.year
  const currentMonthIndex = useMemo(() => new Date().getMonth(), [])
  const currentMonthTotal = workbook.monthTotals[currentMonthIndex] ?? 0
  const currentMonthSurplus = workbook.surplus[currentMonthIndex] ?? 0
  const selectedCount = selectedIds.length
  const editableLines = useMemo(
    () => workbook.lines.filter((line) => !line.locked),
    [workbook.lines]
  )
  const allSelected =
    editableLines.length > 0 && selectedCount === editableLines.length
  const someSelected = selectedCount > 0 && !allSelected

  useEffect(() => {
    if (!selectAllRef.current) return
    selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  const recalculate = (
    base: PlannedDebtWorkbook,
    lines: PlannedDebtLine[]
  ): PlannedDebtWorkbook => {
    const monthTotals = Array.from({ length: 12 }, (_, index) =>
      lines.reduce((sum, line) => sum + (line.months[index]?.value ?? 0), 0)
    )
    const yearExpenseTotal = monthTotals.reduce((sum, value) => sum + value, 0)
    return {
      ...base,
      lines,
      monthTotals,
      surplus: monthTotals.map((total) => base.monthlySalary - total),
      yearExpenseTotal,
      yearSurplus: base.monthlySalary * 12 - yearExpenseTotal,
    }
  }

  const syncFooterScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!footerScrollRef.current) return
    footerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
  }

  const syncBodyScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!bodyScrollRef.current) return
    bodyScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
  }

  const handleYearChange = (nextYear: number) => {
    router.push(`/financeiro/planejamento?year=${nextYear}`)
  }

  const handleCreateLine = async () => {
    const title = newTitle.trim()
    if (!title) {
      setError("Informe o nome da mensalidade")
      return
    }

    setBusyKey("create")
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/proxy/planned-debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, year }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar a linha"
        )
        return
      }
      setWorkbook((current) =>
        recalculate(current, [
          ...current.lines,
          {
            ...(data as PlannedDebtLine),
            locked: false,
            source: "PLANNED",
          },
        ])
      )
      setNewTitle("")
      router.refresh()
    } catch {
      setError("Erro de conexão ao criar linha")
    } finally {
      setBusyKey(null)
    }
  }

  const handleRename = async (line: PlannedDebtLine, title: string) => {
    if (line.locked) return
    const next = title.trim()
    if (!next || next === line.title) return

    setBusyKey(line.id)
    setError(null)
    try {
      const response = await fetch(`/api/proxy/planned-debt/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível renomear"
        )
        return
      }
      setWorkbook((current) =>
        recalculate(
          current,
          current.lines.map((item) =>
            item.id === line.id ? (data as PlannedDebtLine) : item
          )
        )
      )
    } catch {
      setError("Erro de conexão ao renomear")
    } finally {
      setBusyKey(null)
    }
  }

  const handleCellSave = async (
    line: PlannedDebtLine,
    month: number,
    value: number
  ) => {
    if (line.locked) return
    if (!Number.isFinite(value) || value < 0) {
      setError("Valor inválido")
      return
    }

    const currentValue = line.months[month - 1]?.value ?? 0
    if (value === currentValue) return

    setBusyKey(`${line.id}-${month}`)
    setError(null)
    try {
      const response = await fetch(`/api/proxy/planned-debt/${line.id}/cell`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, value }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar a célula"
        )
        return
      }
      setWorkbook((current) =>
        recalculate(
          current,
          current.lines.map((item) =>
            item.id === line.id ? (data as PlannedDebtLine) : item
          )
        )
      )
    } catch {
      setError("Erro de conexão ao salvar célula")
    } finally {
      setBusyKey(null)
    }
  }

  const handleToggleSelect = (lineId: string) => {
    setSelectedIds((current) =>
      current.includes(lineId)
        ? current.filter((id) => id !== lineId)
        : [...current, lineId]
    )
  }

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(editableLines.map((line) => line.id))
  }

  const handleDelete = async () => {
    if (!pendingDelete) return

    const ids =
      pendingDelete.mode === "single"
        ? [pendingDelete.id]
        : pendingDelete.ids

    const removableIds = ids.filter((id) => {
      const line = workbook.lines.find((item) => item.id === id)
      return line && !line.locked
    })

    if (removableIds.length === 0) {
      setPendingDelete(null)
      setError("Contas fixas não podem ser removidas da planilha")
      return
    }

    setBusyKey(pendingDelete.mode === "single" ? pendingDelete.id : "bulk-delete")
    setError(null)
    setSuccess(null)

    try {
      const results = await Promise.all(
        removableIds.map(async (id) => {
          const response = await fetch(`/api/proxy/planned-debt/${id}`, {
            method: "DELETE",
          })
          return { id, ok: response.ok }
        })
      )

      const removedIds = new Set(
        results.filter((item) => item.ok).map((item) => item.id)
      )

      if (removedIds.size === 0) {
        setError("Não foi possível excluir as linhas selecionadas")
        setPendingDelete(null)
        return
      }

      if (removedIds.size < removableIds.length) {
        setError("Algumas linhas não puderam ser excluídas")
      }

      setWorkbook((current) =>
        recalculate(
          current,
          current.lines.filter((item) => !removedIds.has(item.id))
        )
      )
      setSelectedIds((current) =>
        current.filter((id) => !removedIds.has(id))
      )
      setPendingDelete(null)
      if (removedIds.size === removableIds.length) {
        setSuccess(
          removedIds.size === 1
            ? "Linha removida"
            : `${removedIds.size} linhas removidas`
        )
      }
      router.refresh()
    } catch {
      setError("Erro de conexão ao excluir")
      setPendingDelete(null)
    } finally {
      setBusyKey(null)
    }
  }

  const handleCancelDelete = useCallback(() => {
    if (busyKey) return
    setPendingDelete(null)
  }, [busyKey])

  const handleConsolidate = async (lineId: string) => {
    const target = workbook.lines.find((line) => line.id === lineId)
    if (!target || target.locked) return

    setBusyKey(`c-${lineId}`)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(
        `/api/proxy/planned-debt/${lineId}/consolidate`,
        { method: "POST" }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível consolidar"
        )
        return
      }
      setWorkbook((current) =>
        recalculate(
          current,
          current.lines.filter((item) => item.id !== lineId)
        )
      )
      setSuccess("Dívida introduzida no sistema")
      router.refresh()
    } catch {
      setError("Erro de conexão ao consolidar")
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4">
      <header className="shrink-0 rounded-2xl border border-border/80 bg-surface px-4 py-4 shadow-sm shadow-slate-200/40 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Planilha anual
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
              Planejamento {year}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Contas fixas entram automaticamente e ficam bloqueadas. Planeje o
              restante mês a mês e consolide quando estiver pronto.
            </p>
          </div>

          <div
            className="inline-flex items-center rounded-xl border border-border bg-background p-1"
            role="group"
            aria-label="Selecionar ano"
          >
            <button
              type="button"
              onClick={() => handleYearChange(year - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground"
              aria-label="Ano anterior"
            >
              <IconChevron className="h-4 w-4 rotate-180" />
            </button>
            <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums">
              {year}
            </span>
            <button
              type="button"
              onClick={() => handleYearChange(year + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground"
              aria-label="Próximo ano"
            >
              <IconChevron className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-border/70 bg-background/80 px-3 py-3">
            <p className="text-xs text-muted">Linhas no ano</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums">
              {workbook.lines.length}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {workbook.lines.filter((line) => line.locked).length} conta(s) fixa(s)
            </p>
          </article>
          <article className="rounded-xl border border-border/70 bg-background/80 px-3 py-3">
            <p className="text-xs text-muted">
              Total {MONTH_LABELS[currentMonthIndex]}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums text-accent">
              {formatCurrency(currentMonthTotal)}
            </p>
          </article>
          <article className="rounded-xl border border-border/70 bg-background/80 px-3 py-3">
            <p className="text-xs text-muted">
              Sobra {MONTH_LABELS[currentMonthIndex]}
            </p>
            <p
              className={`mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums ${
                currentMonthSurplus >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(currentMonthSurplus)}
            </p>
          </article>
          <article className="rounded-xl border border-teal-200/70 bg-teal-50/40 px-3 py-3 dark:border-teal-900/40 dark:bg-teal-950/30">
            <p className="text-xs text-muted">Sobra no ano</p>
            <p
              className={`mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums ${
                workbook.yearSurplus >= 0 ? "text-accent" : "text-danger"
              }`}
            >
              {formatCurrency(workbook.yearSurplus)}
            </p>
          </article>
        </div>
      </header>

      {error ? (
        <p
          className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-success dark:bg-emerald-950/40"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">Mensalidades</p>
            {selectedCount > 0 ? (
              <button
                type="button"
                disabled={busyKey === "bulk-delete"}
                onClick={() =>
                  setPendingDelete({ mode: "bulk", ids: selectedIds })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/40 dark:hover:bg-red-900/40"
                aria-label={`Excluir ${selectedCount} linhas selecionadas`}
              >
                <IconTrash className="h-3.5 w-3.5" />
                Excluir selecionadas ({selectedCount})
              </button>
            ) : (
              <p className="text-xs text-muted">
                Contas fixas ficam bloqueadas · ✓ consolida só o planejado
              </p>
            )}
          </div>

          <div
            ref={bodyScrollRef}
            onScroll={syncFooterScroll}
            className="min-h-0 flex-1 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <table className={`w-full ${TABLE_MIN_WIDTH} table-fixed border-collapse text-sm`}>
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#f8fafc] dark:bg-slate-900 text-muted">
                  <th
                    className={`border-b border-border bg-[#f8fafc] dark:bg-slate-900 px-1 py-2.5 ${COL.select}`}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        disabled={editableLines.length === 0}
                        onChange={handleToggleSelectAll}
                        className={checkboxClass}
                        aria-label="Selecionar todas as linhas editáveis"
                      />
                    </div>
                  </th>
                  <th
                    className={`border-b border-border bg-[#f8fafc] dark:bg-slate-900 px-1 py-2.5 ${COL.index}`}
                    aria-hidden="true"
                  />
                  <th
                    className={`border-b border-r border-border bg-[#f8fafc] dark:bg-slate-900 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide ${COL.title}`}
                  >
                    Nome
                  </th>
                  {MONTH_LABELS.map((label, index) => (
                    <th
                      key={label}
                      className={`border-b border-border px-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${COL.month} ${
                        index === currentMonthIndex
                          ? "bg-teal-50 text-accent dark:bg-teal-950/40"
                          : "bg-[#f8fafc] dark:bg-slate-900"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                  <th
                    className={`border-b border-border bg-[#f8fafc] dark:bg-slate-900 px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide ${COL.total}`}
                  >
                    Total
                  </th>
                  <th
                    className={`border-b border-border bg-[#f8fafc] dark:bg-slate-900 px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${COL.actions}`}
                  >
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {workbook.lines.map((line, rowIndex) => {
                  const isLocked = Boolean(line.locked)
                  const isSelected = !isLocked && selectedIds.includes(line.id)

                  return (
                  <tr
                    key={line.id}
                    className={`border-b border-border/50 transition ${
                      isLocked
                        ? "bg-slate-50/80 dark:bg-slate-900/50"
                        : isSelected
                          ? "bg-teal-50/40 hover:bg-slate-50/70 dark:bg-teal-950/30 dark:hover:bg-slate-800/70"
                          : rowIndex % 2 === 1
                            ? "bg-slate-50/30 hover:bg-slate-50/70 dark:bg-slate-900/30 dark:hover:bg-slate-800/70"
                            : "bg-surface hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <td
                      className={`bg-inherit px-1 py-2 ${COL.select}`}
                    >
                      {isLocked ? (
                        <span className="sr-only">Conta fixa bloqueada</span>
                      ) : (
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(line.id)}
                            className={checkboxClass}
                            aria-label={`Selecionar ${line.title}`}
                          />
                        </div>
                      )}
                    </td>
                    <td
                      className={`bg-inherit px-1 py-2 text-center text-xs tabular-nums text-muted ${COL.index}`}
                    >
                      {rowIndex + 1}
                    </td>
                    <td
                      className={`border-r border-border bg-inherit px-1 py-0.5 ${COL.title}`}
                    >
                      {isLocked ? (
                        <div className="flex items-center gap-2 px-2 py-2">
                          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">
                            {line.title}
                          </span>
                          <span className="shrink-0 rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700/80 dark:text-slate-300">
                            {line.source === "PLANNED_EXPENSE"
                              ? "Previsto"
                              : "Fixa"}
                          </span>
                        </div>
                      ) : (
                        <input
                          defaultValue={line.title}
                          disabled={busyKey === line.id}
                          onBlur={(event) =>
                            void handleRename(line, event.target.value)
                          }
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-sm font-medium outline-none focus:border-accent/40 focus:bg-white dark:focus:bg-slate-900"
                          aria-label={`Nome da linha ${line.title}`}
                        />
                      )}
                    </td>
                    {line.months.map((cell) => {
                      const isCurrent = cell.month - 1 === currentMonthIndex
                      return (
                        <td
                          key={`${line.id}-${cell.month}`}
                          className={`px-0.5 py-0.5 ${COL.month} ${
                            isCurrent ? "bg-teal-50/35 dark:bg-teal-950/25" : ""
                          }`}
                        >
                          {isLocked ? (
                            <p
                              className={`px-1.5 py-2 text-right text-[13px] tabular-nums text-slate-600 dark:text-slate-300 ${
                                isCurrent ? "font-medium text-accent" : ""
                              }`}
                            >
                              {cell.value > 0 ? formatCurrency(cell.value) : "—"}
                            </p>
                          ) : (
                            <SheetCurrencyCell
                              value={cell.value}
                              highlight={isCurrent}
                              disabled={busyKey === `${line.id}-${cell.month}`}
                              onCommit={(nextValue) =>
                                void handleCellSave(line, cell.month, nextValue)
                              }
                              ariaLabel={`${line.title} ${MONTH_LABELS[cell.month - 1]}`}
                            />
                          )}
                        </td>
                      )
                    })}
                    <td
                      className={`px-2 py-2 text-right text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-100 ${COL.total}`}
                    >
                      {formatCurrency(line.total)}
                    </td>
                    <td className={`px-1.5 py-1.5 ${COL.actions}`}>
                      {isLocked ? (
                        <p className="px-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
                          {line.source === "PLANNED_EXPENSE"
                            ? "Previsto"
                            : "Conta fixa"}
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={
                              busyKey === `c-${line.id}` || line.total <= 0
                            }
                            onClick={() => void handleConsolidate(line.id)}
                            title="Consolidar no sistema"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label={`Consolidar ${line.title}`}
                          >
                            <IconCheck className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === line.id}
                            onClick={() =>
                              setPendingDelete({
                                mode: "single",
                                id: line.id,
                                title: line.title,
                              })
                            }
                            title="Excluir linha"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:border-red-900/40 dark:hover:bg-red-950/40"
                            aria-label={`Excluir ${line.title}`}
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  )
                })}

                <tr className="border-t border-dashed border-border bg-[#f8fafc] dark:bg-slate-900">
                  <td
                    className={`bg-[#f8fafc] dark:bg-slate-900 px-1 py-2 ${COL.select}`}
                  />
                  <td
                    className={`bg-[#f8fafc] dark:bg-slate-900 px-1 py-2 text-center text-xs tabular-nums text-muted ${COL.index}`}
                  >
                    {workbook.lines.length + 1}
                  </td>
                  <td
                    className={`border-r border-border bg-[#f8fafc] dark:bg-slate-900 px-1 py-1 ${COL.title}`}
                  >
                    <input
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          void handleCreateLine()
                        }
                      }}
                      placeholder="Nova mensalidade..."
                      className="w-full rounded-md border border-dashed border-border bg-surface px-2 py-2 text-sm outline-none focus:border-accent"
                      aria-label="Nova mensalidade"
                    />
                  </td>
                  <td
                    colSpan={12}
                    className="px-3 py-2 text-xs text-muted sm:text-sm"
                  >
                    Digite o nome e pressione Enter para incluir na planilha
                  </td>
                  <td className={COL.total} />
                  <td className={`px-1.5 py-1 text-center ${COL.actions}`}>
                    <button
                      type="button"
                      disabled={busyKey === "create" || !newTitle.trim()}
                      onClick={() => void handleCreateLine()}
                      title="Adicionar mensalidade"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Adicionar mensalidade"
                    >
                      <IconPlus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            ref={footerScrollRef}
            onScroll={syncBodyScroll}
            className="shrink-0 overflow-x-auto border-t border-border bg-surface [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <table className={`w-full ${TABLE_MIN_WIDTH} table-fixed border-collapse text-sm`}>
              <tbody>
                <tr className="bg-slate-100/95 font-semibold dark:bg-slate-800/95">
                  <td
                    colSpan={3}
                    className={`border-r border-border bg-slate-100 px-3 py-2.5 dark:bg-slate-800 ${COL.label}`}
                  >
                    Total Mensal
                  </td>
                  {workbook.monthTotals.map((total, index) => (
                    <td
                      key={`total-${index}`}
                      className={`px-1 py-2.5 text-right text-[13px] tabular-nums ${COL.month} ${
                        index === currentMonthIndex
                          ? "bg-teal-50 text-accent dark:bg-teal-950/40"
                          : "bg-slate-100/95 dark:bg-slate-800/95"
                      }`}
                    >
                      {formatCurrency(total)}
                    </td>
                  ))}
                  <td
                    className={`bg-slate-100/95 px-2 py-2.5 text-right text-[13px] tabular-nums text-accent dark:bg-slate-800/95 ${COL.total}`}
                  >
                    {formatCurrency(workbook.yearExpenseTotal)}
                  </td>
                  <td className={`bg-slate-100/95 dark:bg-slate-800/95 ${COL.actions}`} />
                </tr>
                <tr className="bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <td
                    colSpan={3}
                    className={`border-r border-border bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/30 ${COL.label}`}
                  >
                    Sobra Salário
                  </td>
                  {workbook.surplus.map((value, index) => (
                    <td
                      key={`surplus-${index}`}
                      className={`bg-emerald-50 px-1 py-2.5 text-right text-[13px] tabular-nums dark:bg-emerald-950/30 ${COL.month} ${
                        value < 0 ? "text-danger" : ""
                      }`}
                    >
                      {formatCurrency(value)}
                    </td>
                  ))}
                  <td
                    className={`bg-emerald-50 px-2 py-2.5 text-right text-[13px] tabular-nums dark:bg-emerald-950/30 ${COL.total}`}
                  >
                    {formatCurrency(workbook.yearSurplus)}
                  </td>
                  <td className={`bg-emerald-50 dark:bg-emerald-950/30 ${COL.actions}`} />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:max-h-full">
          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Salários</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Receitas fixas do sistema
                </p>
              </div>
              <Link
                href="/financeiro/receitas-fixas"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Editar
              </Link>
            </div>

            {workbook.salaries.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-3 py-4 text-center">
                <p className="text-sm text-muted">
                  Cadastre receitas fixas para calcular a sobra.
                </p>
                <Link
                  href="/financeiro/receitas-fixas"
                  className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
                >
                  Ir para receitas
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {workbook.salaries.map((salary) => (
                  <li
                    key={salary.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-background px-2.5 py-2 text-sm"
                  >
                    <span className="truncate text-muted">{salary.title}</span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatCurrency(salary.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted">Total / mês</span>
                <span className="font-semibold tabular-nums text-accent">
                  {formatCurrency(workbook.monthlySalary)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted">Total / ano</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(workbook.monthlySalary * 12)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Contas fixas</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Sempre na planilha, sem editar aqui
                </p>
              </div>
              <Link
                href="/financeiro/recorrentes"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Gerenciar
              </Link>
            </div>
            {(workbook.recurringPayments?.length ??
              workbook.lines.filter((line) => line.locked).length) === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-3 py-4 text-center">
                <p className="text-xs text-muted">
                  Nenhuma conta fixa cadastrada
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {(
                  workbook.recurringPayments ??
                  workbook.lines
                    .filter((line) => line.locked)
                    .map((line) => ({
                      id: line.sourceId ?? line.id,
                      title: line.title,
                      value: line.months[0]?.value ?? 0,
                      dayOfMonth: line.dueDay,
                    }))
                ).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-background px-2.5 py-2 text-sm"
                  >
                    <span className="truncate text-muted">{payment.title}</span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatCurrency(payment.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-teal-200/70 bg-teal-50/35 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
            <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">No app</p>
            <p className="mt-1 text-xs leading-relaxed text-teal-900/80 dark:text-teal-200/80">
              Em Dívidas → Confirmar planejamento, confirme a linha e ela vira
              dívida real no sistema.
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={
          pendingDelete?.mode === "bulk"
            ? "Excluir linhas"
            : "Excluir linha"
        }
        description={
          pendingDelete?.mode === "bulk"
            ? `Você está prestes a excluir ${pendingDelete.ids.length} linha(s). Esta ação não pode ser desfeita.`
            : pendingDelete?.mode === "single"
              ? `Você está prestes a excluir "${pendingDelete.title}". Esta ação não pode ser desfeita.`
              : ""
        }
        isLoading={
          busyKey === "bulk-delete" ||
          (pendingDelete?.mode === "single" && busyKey === pendingDelete.id)
        }
        onCancel={handleCancelDelete}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
