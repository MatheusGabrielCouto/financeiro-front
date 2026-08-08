"use client"

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { CategorySearchSelect } from "@/components/category-search-select"
import { CurrencyInput } from "@/components/currency-input"
import { IconCheck, IconClose, IconEdit, IconMore, IconTrash } from "@/components/icons"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Category, PlannedExpense } from "@/lib/types"

type PlannedExpenseRowProps = {
  item: PlannedExpense
  categories: Category[]
}

const statusLabel = (status: PlannedExpense["status"]) => {
  if (status === "PAID") return "Pago"
  if (status === "CANCELLED") return "Cancelado"
  return "Previsto"
}

const statusClass = (status: PlannedExpense["status"]) => {
  if (status === "PAID") return "bg-emerald-50 text-success dark:bg-emerald-950/40"
  if (status === "CANCELLED") return "bg-slate-100 text-muted dark:bg-slate-800"
  return "bg-amber-50 text-warning dark:bg-amber-950/40"
}

const toInputDate = (value: string) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type EditPlannedExpenseModalProps = {
  item: PlannedExpense
  categories: Category[]
  onClose: () => void
}

const EditPlannedExpenseModal = ({
  item,
  categories,
  onClose,
}: EditPlannedExpenseModalProps) => {
  const router = useRouter()
  const titleId = useId()
  const [mounted, setMounted] = useState(false)

  const [title, setTitle] = useState(item.title)
  const [notes, setNotes] = useState(item.notes)
  const [value, setValue] = useState(item.value)
  const [dueDate, setDueDate] = useState(toInputDate(item.dueDate))
  const [categoryId, setCategoryId] = useState(item.categoryId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isLoading, onClose])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (value <= 0) {
      setError("Informe um valor maior que zero")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/planned-expense/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          value,
          dueDate,
          categoryId: categoryId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar as alterações"
        )
        return
      }

      router.refresh()
      onClose()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Fechar edição"
        onClick={() => {
          if (!isLoading) onClose()
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-slate-900/15 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
          >
            Editar gasto previsto
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-border p-2 text-muted transition hover:bg-slate-50 hover:text-foreground disabled:opacity-60 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-3"
          aria-label={`Editar gasto previsto ${item.title}`}
        >
          <label className="block space-y-1">
            <span className="text-sm font-medium">Nome do gasto</span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
              aria-label="Nome do gasto previsto"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Valor</span>
              <CurrencyInput
                required
                value={value}
                onValueChange={setValue}
                ariaLabel="Valor do gasto previsto"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Data prevista</span>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                aria-label="Data prevista do gasto"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Observação (opcional)</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
              aria-label="Observação do gasto previsto"
            />
          </label>

          <CategorySearchSelect
            categories={categories}
            value={categoryId}
            onValueChange={setCategoryId}
            ariaLabel="Categoria do gasto previsto"
            allowEmpty
            emptyLabel="Sem categoria"
            placeholder="Buscar categoria..."
          />

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export const PlannedExpenseRow = ({ item, categories }: PlannedExpenseRowProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const hasMenu = item.status === "SCHEDULED" || item.status === "CANCELLED"

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])

  const handleToggleMenu = () => setMenuOpen((prev) => !prev)
  const handleMenuKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleToggleMenu()
    }
  }

  const handleStartEdit = () => {
    setMenuOpen(false)
    setIsEditing(true)
  }

  return (
    <li className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{item.title}</p>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${statusClass(
                item.status
              )}`}
            >
              {statusLabel(item.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatDate(item.dueDate)}
            {item.category ? ` · ${item.category.title}` : ""}
            {item.notes ? ` · ${item.notes}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <p className="text-base font-semibold tabular-nums text-danger">
            {formatCurrency(item.value)}
          </p>

          {hasMenu ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={handleToggleMenu}
                onKeyDown={handleMenuKeyDown}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:bg-slate-800"
                aria-label={`Mais ações para ${item.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                tabIndex={0}
              >
                <IconMore className="h-4 w-4" />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg shadow-slate-200/70"
                >
                  {item.status === "SCHEDULED" ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleStartEdit}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-slate-50 dark:hover:bg-slate-800"
                        aria-label={`Editar gasto previsto ${item.title}`}
                      >
                        <IconEdit className="h-4 w-4 shrink-0" />
                        Editar
                      </button>
                      <ProxyActionButton
                        asMenuItem
                        icon={IconCheck}
                        path={`/planned-expense/${item.id}/pay`}
                        method="POST"
                        label="Pagar agora"
                        loadingLabel="Pagando..."
                        variant="primary"
                        onSuccess={() => setMenuOpen(false)}
                        ariaLabel={`Pagar gasto previsto ${item.title}`}
                      />
                      <ProxyActionButton
                        asMenuItem
                        icon={IconClose}
                        path={`/planned-expense/${item.id}`}
                        method="PATCH"
                        label="Cancelar"
                        loadingLabel="Cancelando..."
                        variant="ghost"
                        body={{ status: "CANCELLED" }}
                        onSuccess={() => setMenuOpen(false)}
                        ariaLabel={`Cancelar gasto previsto ${item.title}`}
                      />
                      <div className="my-1 border-t border-border" />
                    </>
                  ) : null}
                  <ProxyActionButton
                    asMenuItem
                    icon={IconTrash}
                    path={`/planned-expense/${item.id}`}
                    method="DELETE"
                    label="Excluir"
                    variant="danger"
                    confirmTitle="Excluir gasto previsto"
                    confirmMessage={`Você está prestes a excluir "${item.title}". Esta ação não pode ser desfeita.`}
                    onSuccess={() => setMenuOpen(false)}
                    ariaLabel={`Excluir gasto previsto ${item.title}`}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <EditPlannedExpenseModal
          item={item}
          categories={categories}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </li>
  )
}
