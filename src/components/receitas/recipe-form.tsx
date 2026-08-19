"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconPlus, IconTrash } from "@/components/icons"
import { formatRecipeDuration, RECIPE_DIFFICULTY_LABELS } from "@/lib/recipe-labels"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"
import type {
  CreateRecipeBody,
  Recipe,
  RecipeCategory,
  RecipeDifficulty,
  RecipeIngredientInput,
  RecipeStepInput,
} from "@/lib/types"

type IngredientDraft = RecipeIngredientInput & { key: string }
type StepDraft = RecipeStepInput & { key: string }

type RecipeFormProps = {
  categories: RecipeCategory[]
  initial?: Recipe
  cancelHref?: string
}

const createKey = () => Math.random().toString(36).slice(2)

const emptyIngredient = (): IngredientDraft => ({
  key: createKey(),
  name: "",
  quantity: "",
  unit: "",
  groupLabel: "",
})

const emptyStep = (): StepDraft => ({
  key: createKey(),
  instruction: "",
  timerMinutes: null,
})

const DIFFICULTY_OPTIONS: { value: RecipeDifficulty; label: string }[] = [
  { value: "EASY", label: RECIPE_DIFFICULTY_LABELS.EASY },
  { value: "MEDIUM", label: RECIPE_DIFFICULTY_LABELS.MEDIUM },
  { value: "HARD", label: RECIPE_DIFFICULTY_LABELS.HARD },
]

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent transition focus:ring-2"

const sectionClass = "space-y-4 rounded-2xl border border-border/70 bg-surface p-5 md:p-6"

type RecipeFormPreviewProps = {
  title: string
  description: string
  category: RecipeCategory | null
  difficulty: RecipeDifficulty | ""
  servings: string
  prepMinutes: string
  cookMinutes: string
  ingredientCount: number
  stepCount: number
}

const RecipeFormPreview = ({
  title,
  description,
  category,
  difficulty,
  servings,
  prepMinutes,
  cookMinutes,
  ingredientCount,
  stepCount,
}: RecipeFormPreviewProps) => {
  const visual = getRecipeCategoryVisual(category?.color ?? "violet")
  const duration = formatRecipeDuration(
    prepMinutes ? Number(prepMinutes) : null,
    cookMinutes ? Number(cookMinutes) : null
  )

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Prévia</p>

      <div
        className={`overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${visual.placeholder}`}
      >
        <div className="flex aspect-[4/3] flex-col items-center justify-center px-4 text-center">
          <span className="text-4xl" aria-hidden>
            {category?.emoji ?? "🍽️"}
          </span>
          <p className="mt-3 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
            {title.trim() || "Título da receita"}
          </p>
          {category ? (
            <p className={`mt-1 text-xs font-medium ${visual.label}`}>{category.name}</p>
          ) : null}
        </div>
      </div>

      {description.trim() ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{description.trim()}</p>
      ) : (
        <p className="text-sm text-muted">A descrição aparece aqui quando você preencher.</p>
      )}

      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-border/80">
          <span className="text-muted">Ingredientes</span>
          <span className="font-semibold">{ingredientCount}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-border/80">
          <span className="text-muted">Passos</span>
          <span className="font-semibold">{stepCount}</span>
        </li>
        {duration ? (
          <li className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-border/80">
            <span className="text-muted">Tempo total</span>
            <span className="font-semibold">{duration}</span>
          </li>
        ) : null}
        {servings ? (
          <li className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-border/80">
            <span className="text-muted">Porções</span>
            <span className="font-semibold">{servings}</span>
          </li>
        ) : null}
        {difficulty ? (
          <li className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-border/80">
            <span className="text-muted">Dificuldade</span>
            <span className="font-semibold">{RECIPE_DIFFICULTY_LABELS[difficulty]}</span>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

export const RecipeForm = ({ categories, initial, cancelHref }: RecipeFormProps) => {
  const router = useRouter()
  const isEditing = Boolean(initial)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [servings, setServings] = useState(initial?.servings?.toString() ?? "")
  const [prepMinutes, setPrepMinutes] = useState(initial?.prepMinutes?.toString() ?? "")
  const [cookMinutes, setCookMinutes] = useState(initial?.cookMinutes?.toString() ?? "")
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | "">(
    initial?.difficulty ?? ""
  )
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initial?.ingredients.length
      ? initial.ingredients.map((item) => ({ ...item, key: item.id }))
      : [emptyIngredient()]
  )
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps.length
      ? initial.steps.map((item) => ({ ...item, key: item.id }))
      : [emptyStep()]
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  )

  const validIngredientCount = ingredients.filter((item) => item.name.trim()).length
  const validStepCount = steps.filter((item) => item.instruction.trim()).length

  const backHref =
    cancelHref ?? (isEditing ? `/pessoal/receitas/${initial!.id}` : "/pessoal/receitas")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Informe o título da receita")
      return
    }

    const validIngredients = ingredients.filter((item) => item.name.trim())
    const validSteps = steps.filter((item) => item.instruction.trim())

    const body: CreateRecipeBody = {
      title: title.trim(),
      description: description.trim(),
      servings: servings ? Number(servings) : null,
      prepMinutes: prepMinutes ? Number(prepMinutes) : null,
      cookMinutes: cookMinutes ? Number(cookMinutes) : null,
      difficulty: difficulty || null,
      categoryId: categoryId || null,
      ingredients: validIngredients.map((item, index) => ({
        name: item.name.trim(),
        quantity: item.quantity?.trim() || null,
        unit: item.unit?.trim() || null,
        groupLabel: item.groupLabel?.trim() || null,
        sortOrder: index,
      })),
      steps: validSteps.map((item, index) => ({
        instruction: item.instruction.trim(),
        timerMinutes: item.timerMinutes ?? null,
        sortOrder: index,
      })),
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        isEditing ? `/api/proxy/recipe/${initial!.id}` : "/api/proxy/recipe",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(typeof data.message === "string" ? data.message : "Erro ao salvar receita")
        return
      }

      const saved = (await response.json()) as Recipe
      router.push(`/pessoal/receitas/${saved.id}`)
      router.refresh()
    } catch {
      setError("Erro ao salvar receita")
    } finally {
      setIsLoading(false)
    }
  }

  const previewProps: RecipeFormPreviewProps = {
    title,
    description,
    category: selectedCategory,
    difficulty,
    servings,
    prepMinutes,
    cookMinutes,
    ingredientCount: validIngredientCount,
    stepCount: validStepCount,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="xl:hidden">
        <RecipeFormPreview {...previewProps} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
        <div className="space-y-6">
          <section className={sectionClass} aria-labelledby="recipe-general-heading">
            <div>
              <h2
                id="recipe-general-heading"
                className="font-[family-name:var(--font-display)] text-base font-semibold"
              >
                Informações gerais
              </h2>
              <p className="mt-1 text-sm text-muted">
                Nome, coleção e tempos — o essencial para encontrar a receita depois.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Título</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={fieldClass}
                placeholder="Ex.: Cappuccino clássico"
                aria-label="Título da receita"
                autoFocus={!isEditing}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Descrição</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`${fieldClass} min-h-24 resize-y`}
                placeholder="Resumo do sabor, copo ideal ou dica rápida..."
                aria-label="Descrição da receita"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium">Categoria</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria da receita">
                <button
                  type="button"
                  onClick={() => setCategoryId("")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !categoryId
                      ? "bg-accent text-white"
                      : "border border-border bg-background text-foreground hover:bg-accent-soft/40"
                  }`}
                  aria-pressed={!categoryId}
                >
                  Sem categoria
                </button>
                {categories.map((category) => {
                  const visual = getRecipeCategoryVisual(category.color)
                  const isActive = categoryId === category.id

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive ? visual.chipActive : visual.chip
                      }`}
                      aria-pressed={isActive}
                    >
                      {category.emoji} {category.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Dificuldade</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Dificuldade da receita">
                <button
                  type="button"
                  onClick={() => setDifficulty("")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !difficulty
                      ? "bg-accent text-white"
                      : "border border-border bg-background hover:bg-accent-soft/40"
                  }`}
                  aria-pressed={!difficulty}
                >
                  Não informada
                </button>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      difficulty === option.value
                        ? "bg-accent text-white"
                        : "border border-border bg-background hover:bg-accent-soft/40"
                    }`}
                    aria-pressed={difficulty === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Porções</span>
                <input
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  className={fieldClass}
                  placeholder="1"
                  aria-label="Porções"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Preparo (min)</span>
                <input
                  type="number"
                  min={0}
                  value={prepMinutes}
                  onChange={(event) => setPrepMinutes(event.target.value)}
                  className={fieldClass}
                  placeholder="5"
                  aria-label="Tempo de preparo em minutos"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Cozimento (min)</span>
                <input
                  type="number"
                  min={0}
                  value={cookMinutes}
                  onChange={(event) => setCookMinutes(event.target.value)}
                  className={fieldClass}
                  placeholder="0"
                  aria-label="Tempo de cozimento em minutos"
                />
              </label>
            </div>
          </section>

          <section className={sectionClass} aria-labelledby="recipe-ingredients-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id="recipe-ingredients-heading"
                  className="font-[family-name:var(--font-display)] text-base font-semibold"
                >
                  Ingredientes
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Quantidade, unidade e nome. Use grupos para bases ou molhos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIngredients((current) => [...current, emptyIngredient()])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent-soft/40"
                aria-label="Adicionar ingrediente"
              >
                <IconPlus className="h-4 w-4" />
                Adicionar
              </button>
            </div>

            <div className="hidden gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted sm:grid sm:grid-cols-12">
              <span className="sm:col-span-12">Grupo</span>
              <span className="sm:col-span-2">Qtd</span>
              <span className="sm:col-span-2">Un.</span>
              <span className="sm:col-span-7">Ingrediente</span>
            </div>

            <ul className="space-y-3">
              {ingredients.map((item, index) => (
                <li
                  key={item.key}
                  className="grid gap-2 rounded-xl border border-border/70 bg-background/50 p-3 sm:grid-cols-12"
                >
                  <div className="flex items-center justify-between gap-2 sm:col-span-12 sm:hidden">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Ingrediente {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setIngredients((current) =>
                          current.length === 1
                            ? current
                            : current.filter((row) => row.key !== item.key)
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted"
                      aria-label={`Remover ingrediente ${index + 1}`}
                      tabIndex={0}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    value={item.groupLabel ?? ""}
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, groupLabel: event.target.value }
                            : row
                        )
                      )
                    }
                    className={`${fieldClass} sm:col-span-12`}
                    placeholder="Grupo (opcional) — ex.: Base de espresso"
                    aria-label={`Grupo do ingrediente ${index + 1}`}
                  />
                  <input
                    value={item.quantity ?? ""}
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, quantity: event.target.value } : row
                        )
                      )
                    }
                    className={`${fieldClass} sm:col-span-2`}
                    placeholder="36"
                    aria-label={`Quantidade do ingrediente ${index + 1}`}
                  />
                  <input
                    value={item.unit ?? ""}
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, unit: event.target.value } : row
                        )
                      )
                    }
                    className={`${fieldClass} sm:col-span-2`}
                    placeholder="g"
                    aria-label={`Unidade do ingrediente ${index + 1}`}
                  />
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, name: event.target.value } : row
                        )
                      )
                    }
                    className={`${fieldClass} sm:col-span-7`}
                    placeholder="Nome do ingrediente"
                    aria-label={`Nome do ingrediente ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setIngredients((current) =>
                        current.length === 1
                          ? current
                          : current.filter((row) => row.key !== item.key)
                      )
                    }
                    className="hidden h-10 w-10 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-accent-soft/40 sm:col-span-1 sm:inline-flex"
                    aria-label={`Remover ingrediente ${index + 1}`}
                    tabIndex={0}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={sectionClass} aria-labelledby="recipe-steps-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id="recipe-steps-heading"
                  className="font-[family-name:var(--font-display)] text-base font-semibold"
                >
                  Modo de preparo
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Um passo por bloco. Timer opcional para o modo preparo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSteps((current) => [...current, emptyStep()])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent-soft/40"
                aria-label="Adicionar passo"
              >
                <IconPlus className="h-4 w-4" />
                Adicionar passo
              </button>
            </div>

            <ol className="space-y-3">
              {steps.map((item, index) => (
                <li
                  key={item.key}
                  className="rounded-xl border border-border/70 bg-background/50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold">Passo {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSteps((current) =>
                          current.length === 1
                            ? current
                            : current.filter((row) => row.key !== item.key)
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-accent-soft/40"
                      aria-label={`Remover passo ${index + 1}`}
                      tabIndex={0}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={item.instruction}
                    onChange={(event) =>
                      setSteps((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, instruction: event.target.value } : row
                        )
                      )
                    }
                    className={`${fieldClass} min-h-24 resize-y`}
                    placeholder="Descreva o que fazer neste passo..."
                    aria-label={`Instrução do passo ${index + 1}`}
                  />

                  <label className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">Timer (min)</span>
                    <input
                      type="number"
                      min={1}
                      value={item.timerMinutes ?? ""}
                      onChange={(event) =>
                        setSteps((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  timerMinutes: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : row
                          )
                        )
                      }
                      className={`${fieldClass} max-w-[7rem]`}
                      placeholder="—"
                      aria-label={`Timer do passo ${index + 1}`}
                    />
                  </label>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="hidden xl:block xl:sticky xl:top-24">
          <RecipeFormPreview {...previewProps} />
        </aside>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-border/70 bg-background/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent-soft/40"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {isLoading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar receita"}
          </button>
        </div>
      </div>
    </form>
  )
}
