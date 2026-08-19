"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { IconCheck, IconClose, IconExport } from "@/components/icons"
import {
  downloadRecipeExport,
  formatRecipesExport,
  type RecipeExportFormat,
} from "@/lib/recipe-export"
import type { RecipeListQueryParams } from "@/lib/finance-api"
import { buildRecipeListQuery } from "@/lib/recipe-filters"
import type { Recipe } from "@/lib/types"

type RecipeExportDialogProps = {
  open: boolean
  onClose: () => void
  filters: RecipeListQueryParams
  recipeCount: number
  scopeLabel: string
}

export const RecipeExportDialog = ({
  open,
  onClose,
  filters,
  recipeCount,
  scopeLabel,
}: RecipeExportDialogProps) => {
  const titleId = useId()
  const descriptionId = useId()
  const [mounted, setMounted] = useState(false)
  const [format, setFormat] = useState<RecipeExportFormat>("text")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const exportContent = useMemo(
    () => (recipes.length > 0 ? formatRecipesExport(recipes, format) : ""),
    [recipes, format]
  )

  const loadRecipes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setCopied(false)

    try {
      const query = buildRecipeListQuery(filters)
      const suffix = query.toString()
      const response = await fetch(`/api/proxy/recipe/export${suffix ? `?${suffix}` : ""}`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(typeof data.message === "string" ? data.message : "Erro ao exportar receitas")
      }

      const data = (await response.json()) as Recipe[]
      setRecipes(data)
    } catch (loadError) {
      setRecipes([])
      setError(loadError instanceof Error ? loadError.message : "Erro ao exportar receitas")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!open) return
    void loadRecipes()
  }, [open, loadRecipes])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose()
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, isLoading, onClose])

  const handleCopy = async () => {
    if (!exportContent) return

    try {
      await navigator.clipboard.writeText(exportContent)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Não foi possível copiar para a área de transferência")
    }
  }

  const handleDownload = () => {
    if (!exportContent) return
    downloadRecipeExport(exportContent, format)
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Fechar exportação"
        onClick={() => {
          if (!isLoading) onClose()
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[min(90vh,52rem)] w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-slate-900/15"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 md:px-6">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
            >
              Exportar receitas
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-muted">
              {scopeLabel} · {recipeCount} receita{recipeCount === 1 ? "" : "s"}
            </p>
          </div>
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-3 md:px-6">
          <div
            className="inline-flex rounded-xl border border-border/70 bg-background/50 p-1"
            role="tablist"
            aria-label="Formato de exportação"
          >
            <button
              type="button"
              role="tab"
              aria-selected={format === "text"}
              onClick={() => setFormat("text")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                format === "text" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Texto
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={format === "json"}
              onClick={() => setFormat("json")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                format === "json" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              JSON
            </button>
          </div>

          <p className="text-xs text-muted">
            Compatível com a importação · {recipes.length} carregada{recipes.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-40 animate-pulse rounded bg-accent-soft/30" />
              <div className="h-64 animate-pulse rounded-2xl bg-accent-soft/20" />
            </div>
          ) : error ? (
            <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : recipes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              Nenhuma receita para exportar com os filtros atuais.
            </p>
          ) : (
            <textarea
              readOnly
              value={exportContent}
              className="min-h-[20rem] w-full resize-y rounded-xl border border-border bg-background px-3 py-3 font-mono text-[13px] leading-relaxed outline-none"
              aria-label="Conteúdo exportado das receitas"
            />
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/70 px-5 py-4 sm:flex-row sm:justify-end md:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={isLoading || !exportContent}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent-soft/40 disabled:opacity-60"
          >
            {copied ? <IconCheck className="h-4 w-4 text-emerald-600" /> : null}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isLoading || !exportContent}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            <IconExport className="h-4 w-4" />
            Baixar arquivo
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

type RecipeExportButtonProps = {
  filters: RecipeListQueryParams
  recipeCount: number
  scopeLabel: string
  className?: string
}

export const RecipeExportButton = ({
  filters,
  recipeCount,
  scopeLabel,
  className = "",
}: RecipeExportButtonProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={recipeCount === 0}
        className={className}
        aria-label="Exportar receitas"
      >
        <IconExport className="h-4 w-4" />
        Exportar
      </button>

      <RecipeExportDialog
        open={open}
        onClose={() => setOpen(false)}
        filters={filters}
        recipeCount={recipeCount}
        scopeLabel={scopeLabel}
      />
    </>
  )
}
