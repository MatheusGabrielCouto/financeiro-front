"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconWarning } from "@/components/icons"
import { RECIPE_DIFFICULTY_LABELS } from "@/lib/recipe-labels"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"
import {
  parseRecipeImport,
  RECIPE_IMPORT_JSON_TEMPLATE,
  RECIPE_IMPORT_TEMPLATE,
  toCreateRecipeBody,
  type ParsedRecipeImport,
  type RecipeImportFormat,
} from "@/lib/recipe-import-parser"
import type { RecipeCategory } from "@/lib/types"

type RecipeImportFormProps = {
  categories: RecipeCategory[]
}

type ImportProgress = {
  total: number
  done: number
  current: string
}

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent transition focus:ring-2"

const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const RecipePreviewCard = ({
  recipe,
  categoryLabel,
}: {
  recipe: ParsedRecipeImport
  categoryLabel: string | null
}) => (
  <article className="rounded-xl border border-border/70 bg-background/50 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="font-semibold">{recipe.title}</h3>
        {categoryLabel ? (
          <p className="mt-0.5 text-xs text-muted">Categoria: {categoryLabel}</p>
        ) : (
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">Sem categoria</p>
        )}
      </div>
      <span className="rounded-full bg-accent-soft/50 px-2 py-0.5 text-xs font-medium text-accent">
        {recipe.sourceLabel}
      </span>
    </div>

    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
      {recipe.servings ? <span>{recipe.servings} porção(ões)</span> : null}
      {recipe.prepMinutes ? <span>{recipe.prepMinutes} min prep</span> : null}
      {recipe.difficulty ? (
        <span>{RECIPE_DIFFICULTY_LABELS[recipe.difficulty]}</span>
      ) : null}
      <span>{recipe.ingredients.length} ing.</span>
      <span>{recipe.steps.length} passos</span>
    </div>

    {recipe.warnings.length > 0 ? (
      <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
        {recipe.warnings.map((warning) => (
          <li key={warning} className="flex items-start gap-1.5">
            <IconWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {warning}
          </li>
        ))}
      </ul>
    ) : null}
  </article>
)

export const RecipeImportForm = ({ categories }: RecipeImportFormProps) => {
  const router = useRouter()
  const [format, setFormat] = useState<RecipeImportFormat>("text")
  const [textContent, setTextContent] = useState(RECIPE_IMPORT_TEMPLATE)
  const [jsonContent, setJsonContent] = useState(RECIPE_IMPORT_JSON_TEMPLATE)
  const [globalCategoryId, setGlobalCategoryId] = useState("")
  const [createMissingCategories, setCreateMissingCategories] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)

  const content = format === "json" ? jsonContent : textContent
  const parseResult = useMemo(() => parseRecipeImport(content, format), [content, format])

  const handleFormatChange = (nextFormat: RecipeImportFormat) => {
    setFormat(nextFormat)
    setError(null)
    setSuccessCount(null)
  }

  const handleContentChange = (value: string) => {
    if (format === "json") {
      setJsonContent(value)
      return
    }
    setTextContent(value)
  }

  const handleRestoreExample = () => {
    if (format === "json") {
      setJsonContent(RECIPE_IMPORT_JSON_TEMPLATE)
      return
    }
    setTextContent(RECIPE_IMPORT_TEMPLATE)
  }

  const resolveCategoryLabel = (recipe: ParsedRecipeImport) => {
    if (recipe.categoryName) return recipe.categoryName
    if (globalCategoryId) {
      return categories.find((category) => category.id === globalCategoryId)?.name ?? null
    }
    return parseResult.defaultCategoryName
  }

  const canImport =
    parseResult.recipes.length > 0 &&
    parseResult.errors.length === 0 &&
    !isImporting

  const handleImport = async () => {
    if (!canImport) return

    setError(null)
    setSuccessCount(null)
    setIsImporting(true)
    setProgress({ total: parseResult.recipes.length, done: 0, current: "" })

    const categoryCache = new Map<string, string>(
      categories.map((category) => [normalizeName(category.name), category.id])
    )
    let imported = 0

    try {
      for (const recipe of parseResult.recipes) {
        setProgress({
          total: parseResult.recipes.length,
          done: imported,
          current: recipe.title,
        })

        let categoryId: string | null = null
        const categoryName = recipe.categoryName ?? parseResult.defaultCategoryName

        if (categoryName) {
          const key = normalizeName(categoryName)
          const existing = categoryCache.get(key)

          if (existing) {
            categoryId = existing
          } else if (createMissingCategories) {
            const response = await fetch("/api/proxy/recipe/category", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: categoryName.trim(),
                emoji: "🍽️",
                color: "violet",
              }),
            })

            if (!response.ok) {
              const data = await response.json().catch(() => ({}))
              throw new Error(
                typeof data.message === "string"
                  ? data.message
                  : `Erro ao criar categoria "${categoryName}"`
              )
            }

            const created = (await response.json()) as RecipeCategory
            categoryCache.set(key, created.id)
            categoryId = created.id
          }
        }

        if (!categoryId && globalCategoryId) {
          categoryId = globalCategoryId
        }

        const body = toCreateRecipeBody(recipe, categoryId)
        const response = await fetch("/api/proxy/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(
            typeof data.message === "string"
              ? data.message
              : `Erro ao importar "${recipe.title}"`
          )
        }

        imported += 1
      }

      setSuccessCount(imported)
      setProgress({
        total: parseResult.recipes.length,
        done: imported,
        current: "",
      })
      router.refresh()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Erro ao importar receitas")
    } finally {
      setIsImporting(false)
    }
  }

  const selectedGlobalCategory = categories.find((category) => category.id === globalCategoryId)
  const globalVisual = getRecipeCategoryVisual(selectedGlobalCategory?.color ?? "violet")

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border/70 bg-surface p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                  {format === "json" ? "JSON" : "Texto formatado"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {format === "json"
                    ? "Cole um array de receitas ou um objeto com category e recipes."
                    : "Cole uma ou várias receitas. Separe blocos com --- e use @ Coleção ou Categoria: Nome."}
                </p>
              </div>

              <div
                className="inline-flex rounded-xl border border-border/70 bg-background/50 p-1"
                role="tablist"
                aria-label="Formato de importação"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={format === "text"}
                  onClick={() => handleFormatChange("text")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    format === "text"
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Texto
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={format === "json"}
                  onClick={() => handleFormatChange("json")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    format === "json"
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
              className={`${fieldClass} min-h-[28rem] resize-y font-mono text-[13px] leading-relaxed`}
              spellCheck={false}
              aria-label={
                format === "json"
                  ? "JSON das receitas para importar"
                  : "Texto das receitas para importar"
              }
            />

            <button
              type="button"
              onClick={handleRestoreExample}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Restaurar exemplo
            </button>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/70 bg-surface p-5 md:p-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                Prévia ({parseResult.recipes.length})
              </h2>
              <p className="mt-1 text-sm text-muted">
                Confira título, categoria e avisos antes de importar.
              </p>
            </div>

            {parseResult.errors.length > 0 ? (
              <ul className="space-y-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {parseResult.errors.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <IconWarning className="mt-0.5 h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}

            {parseResult.recipes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {format === "json"
                  ? "Nenhuma receita reconhecida. Use um array ou um objeto com recipes."
                  : "Nenhuma receita reconhecida ainda. Comece com # Título da receita."}
              </p>
            ) : (
              <div className="space-y-3">
                {parseResult.recipes.map((recipe) => (
                  <RecipePreviewCard
                    key={`${recipe.lineNumber}-${recipe.title}`}
                    recipe={recipe}
                    categoryLabel={resolveCategoryLabel(recipe)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="space-y-4 rounded-2xl border border-border/70 bg-surface p-5">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                Categoria global
              </h2>
              <p className="mt-1 text-sm text-muted">
                Aplicada quando a receita não tiver categoria no texto ou no JSON.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Coleção padrão</span>
              <select
                value={globalCategoryId}
                onChange={(event) => setGlobalCategoryId(event.target.value)}
                className={fieldClass}
                aria-label="Categoria global para importação"
              >
                <option value="">Nenhuma (usar só o texto)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedGlobalCategory ? (
              <div
                className={`flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 ${globalVisual.iconBg}`}
              >
                <span className="text-xl" aria-hidden>
                  {selectedGlobalCategory.emoji}
                </span>
                <span className={`text-sm font-semibold ${globalVisual.label}`}>
                  {selectedGlobalCategory.name}
                </span>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/50 px-3 py-3">
              <input
                type="checkbox"
                checked={createMissingCategories}
                onChange={(event) => setCreateMissingCategories(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-sm">
                <span className="font-medium">Criar categorias novas</span>
                <span className="mt-0.5 block text-muted">
                  Se o texto citar uma coleção que ainda não existe, ela será criada na importação.
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Formato</p>
            {format === "json" ? (
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <code className="text-xs text-foreground">{"{ category, recipes: [...] }"}</code>
                </li>
                <li>
                  ou array direto: <code className="text-xs text-foreground">[{"{ ... }"}]</code>
                </li>
                <li>
                  Campos: <code className="text-xs">title</code>,{" "}
                  <code className="text-xs">category</code>,{" "}
                  <code className="text-xs">ingredients</code>,{" "}
                  <code className="text-xs">steps</code>
                </li>
                <li>Ingredientes e passos também aceitam strings simples</li>
                <li>Aliases em português: titulo, categoria, ingredientes, passos</li>
              </ul>
            ) : (
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <code className="text-xs text-foreground"># Título</code> — obrigatório
                </li>
                <li>
                  <code className="text-xs text-foreground">## Ingredientes</code> — lista com{" "}
                  <code className="text-xs">-</code>
                </li>
                <li>
                  <code className="text-xs text-foreground">## Passos</code> — numerados ou com{" "}
                  <code className="text-xs">-</code>
                </li>
                <li>
                  Timer no passo: <code className="text-xs">(5 min)</code>
                </li>
                <li>
                  Grupo do ingrediente: <code className="text-xs">[Nome]</code>
                </li>
              </ul>
            )}
          </section>
        </aside>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {successCount !== null ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <p className="flex items-center gap-2 font-semibold">
            <IconCheck className="h-4 w-4" />
            {successCount} receita{successCount === 1 ? "" : "s"} importada
            {successCount === 1 ? "" : "s"} com sucesso.
          </p>
          <Link
            href="/pessoal/receitas"
            className="mt-2 inline-block font-semibold text-accent hover:underline"
          >
            Ver livro de receitas
          </Link>
        </div>
      ) : null}

      {progress && isImporting ? (
        <p className="text-sm text-muted">
          Importando {progress.done + 1} de {progress.total}
          {progress.current ? `: ${progress.current}` : ""}…
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-border/70 bg-background/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/pessoal/receitas"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent-soft/40"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {isImporting
              ? "Importando..."
              : `Importar ${parseResult.recipes.length} receita${parseResult.recipes.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  )
}
