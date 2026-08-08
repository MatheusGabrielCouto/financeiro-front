"use client"

import { FormEvent, useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { CategorySearchSelect } from "@/components/category-search-select"
import { IconClose } from "@/components/icons"
import type { Category, Debt, InterestRateType } from "@/lib/types"

type EditDebtFormProps = {
  debt: Debt
  categories: Category[]
}

export const EditDebtForm = ({ debt, categories }: EditDebtFormProps) => {
  const router = useRouter()
  const titleId = useId()
  const descriptionId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [title, setTitle] = useState(debt.title)
  const [description, setDescription] = useState(debt.description ?? "")
  const [interestRate, setInterestRate] = useState(String(debt.interestRate ?? 0))
  const [interestRateType, setInterestRateType] = useState<InterestRateType>(
    debt.interestRateType ?? "MONTHLY"
  )
  const [categoryId, setCategoryId] = useState(debt.categoryId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    setTitle(debt.title)
    setDescription(debt.description ?? "")
    setInterestRate(String(debt.interestRate ?? 0))
    setInterestRateType(debt.interestRateType ?? "MONTHLY")
    setCategoryId(debt.categoryId ?? "")
    setError(null)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, debt, isLoading])

  const handleClose = () => {
    if (isLoading) return
    setIsOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/debt/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          interestRate: Number(interestRate) || 0,
          interestRateType,
          categoryId: categoryId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível atualizar a dívida"
        )
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  const modal =
    mounted && isOpen
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              aria-label="Fechar edição da dívida"
              onClick={handleClose}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-slate-900/15 md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id={titleId}
                    className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
                  >
                    Editar dívida
                  </h2>
                  <p id={descriptionId} className="mt-1 text-sm text-muted">
                    Atualize os dados principais do compromisso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-lg border border-border p-2 text-muted transition hover:bg-slate-50 hover:text-foreground disabled:opacity-60 dark:hover:bg-slate-900/50"
                  aria-label="Fechar"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Título</span>
                  <input
                    required
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                    aria-label="Título da dívida"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Descrição</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                    aria-label="Descrição da dívida"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Juros (%)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={interestRate}
                      onChange={(event) => setInterestRate(event.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                      aria-label="Taxa de juros"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Tipo da taxa</span>
                    <select
                      value={interestRateType}
                      onChange={(event) =>
                        setInterestRateType(
                          event.target.value as InterestRateType
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                      aria-label="Tipo da taxa de juros"
                    >
                      <option value="MONTHLY">Ao mês</option>
                      <option value="DAILY">Ao dia</option>
                    </select>
                  </label>

                  <div className="block space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-medium">Categoria</span>
                    <CategorySearchSelect
                      categories={categories}
                      value={categoryId}
                      onValueChange={setCategoryId}
                      ariaLabel="Categoria da dívida"
                      allowEmpty
                      emptyLabel="Sem categoria"
                      placeholder="Buscar categoria..."
                    />
                  </div>
                </div>

                {error ? (
                  <p
                    className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-900/50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
                  >
                    {isLoading ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
        aria-label={`Editar dívida ${debt.title}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        Editar dívida
      </button>
      {modal}
    </>
  )
}
