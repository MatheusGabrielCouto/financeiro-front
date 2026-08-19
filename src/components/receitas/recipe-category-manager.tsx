"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconChevron, IconEdit, IconTrash } from "@/components/icons"
import { ProxyActionButton } from "@/components/proxy-action-button"
import {
  RECIPE_CATEGORY_COLOR_OPTIONS,
  RECIPE_CATEGORY_EMOJI_PRESETS,
  resolveRecipeCategoryColor,
} from "@/lib/recipe-category-options"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"
import type { RecipeCategory } from "@/lib/types"
import type { ModuleAccentToken } from "@/lib/nav-registry"

type RecipeCategoryManagerProps = {
  categories: RecipeCategory[]
}

type CategoryDraft = {
  name: string
  emoji: string
  color: ModuleAccentToken
}

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent transition focus:ring-2"

const ColorPicker = ({
  value,
  onChange,
  ariaLabel,
}: {
  value: ModuleAccentToken
  onChange: (color: ModuleAccentToken) => void
  ariaLabel: string
}) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
    {RECIPE_CATEGORY_COLOR_OPTIONS.map((option) => {
      const visual = getRecipeCategoryVisual(option.id)
      const isActive = value === option.id

      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            isActive ? visual.chipActive : visual.chip
          }`}
          aria-pressed={isActive}
          aria-label={`Cor ${option.label}`}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

const EmojiPicker = ({
  value,
  onChange,
}: {
  value: string
  onChange: (emoji: string) => void
}) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label="Emoji da categoria">
    {RECIPE_CATEGORY_EMOJI_PRESETS.map((emoji) => (
      <button
        key={emoji}
        type="button"
        onClick={() => onChange(emoji)}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
          value === emoji
            ? "border-accent bg-accent-soft/60"
            : "border-border bg-background hover:bg-accent-soft/30"
        }`}
        aria-pressed={value === emoji}
        aria-label={`Emoji ${emoji}`}
      >
        {emoji}
      </button>
    ))}
  </div>
)

const CategoryPreview = ({ draft }: { draft: CategoryDraft }) => {
  const visual = getRecipeCategoryVisual(draft.color)

  return (
    <div className={`rounded-2xl border border-border/70 bg-gradient-to-br ${visual.placeholder} p-4`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${visual.iconBg}`}
        >
          {draft.emoji || "🍽️"}
        </span>
        <div>
          <p className="font-[family-name:var(--font-display)] text-base font-semibold">
            {draft.name.trim() || "Nome da coleção"}
          </p>
          <p className={`text-xs font-medium ${visual.label}`}>Prévia da categoria</p>
        </div>
      </div>
    </div>
  )
}

type CategoryRowProps = {
  category: RecipeCategory
  onSaved: () => void
}

const CategoryRow = ({ category, onSaved }: CategoryRowProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<CategoryDraft>({
    name: category.name,
    emoji: category.emoji,
    color: resolveRecipeCategoryColor(category.color),
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const visual = getRecipeCategoryVisual(category.color)

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError("Informe o nome da categoria")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/proxy/recipe/category/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          emoji: draft.emoji.trim() || "🍽️",
          color: draft.color,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(typeof data.message === "string" ? data.message : "Erro ao salvar")
        return
      }
      setIsEditing(false)
      onSaved()
    } catch {
      setError("Erro ao salvar categoria")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft({
      name: category.name,
      emoji: category.emoji,
      color: resolveRecipeCategoryColor(category.color),
    })
    setError(null)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <li className="rounded-2xl border border-border/70 bg-surface p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <CategoryPreview draft={draft} />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Nome</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className={fieldClass}
              aria-label="Nome da categoria"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium">Emoji</span>
            <EmojiPicker
              value={draft.emoji}
              onChange={(emoji) => setDraft((current) => ({ ...current, emoji }))}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Cor</span>
            <ColorPicker
              value={draft.color}
              onChange={(color) => setDraft((current) => ({ ...current, color }))}
              ariaLabel="Cor da categoria"
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent-soft/40"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="rounded-2xl border border-border/70 bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${visual.iconBg}`}
          >
            {category.emoji}
          </span>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
              {category.name}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {category.recipeCount} receita{category.recipeCount === 1 ? "" : "s"}
            </p>
            <Link
              href={`/pessoal/receitas?categoryId=${category.id}`}
              className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
            >
              Ver receitas desta coleção
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent-soft/40"
            aria-label={`Editar categoria ${category.name}`}
            tabIndex={0}
          >
            <IconEdit className="h-4 w-4" />
            Editar
          </button>
          <ProxyActionButton
            path={`/recipe/category/${category.id}`}
            method="DELETE"
            label="Excluir"
            loadingLabel="..."
            confirmTitle="Excluir categoria"
            confirmMessage={`Excluir a categoria "${category.name}"? As receitas ficarão sem categoria.`}
            variant="danger"
            icon={IconTrash}
            ariaLabel={`Excluir categoria ${category.name}`}
          />
        </div>
      </div>
    </li>
  )
}

export const RecipeCategoryManager = ({ categories }: RecipeCategoryManagerProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<CategoryDraft>({
    name: "",
    emoji: "🍽️",
    color: "indigo",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const totalRecipes = useMemo(
    () => categories.reduce((sum, category) => sum + category.recipeCount, 0),
    [categories]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!draft.name.trim()) {
      setError("Informe o nome da categoria")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/proxy/recipe/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          emoji: draft.emoji.trim() || "🍽️",
          color: draft.color,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(typeof data.message === "string" ? data.message : "Erro ao criar categoria")
        return
      }
      setDraft({ name: "", emoji: "🍽️", color: "indigo" })
      router.refresh()
    } catch {
      setError("Erro ao criar categoria")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => router.refresh()

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-accent-soft/15"
        aria-expanded={isOpen}
        aria-controls="recipe-category-manager"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Gerenciar categorias
          </h2>
          <p className="mt-1 text-sm text-muted">
            {categories.length} coleção{categories.length === 1 ? "" : "ões"} · {totalRecipes}{" "}
            receita{totalRecipes === 1 ? "" : "s"} organizadas
          </p>
        </div>
        <IconChevron
          className={`h-4 w-4 shrink-0 text-muted transition ${isOpen ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      {isOpen ? (
        <div id="recipe-category-manager" className="space-y-6 border-t border-border/70 px-5 py-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-background/40 p-4">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                  Nova coleção
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Agrupe receitas por tipo, ocasião ou cardápio.
                </p>
              </div>

              <CategoryPreview draft={draft} />

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Nome</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  className={fieldClass}
                  placeholder="Ex.: Drinks, Doces, Café da manhã"
                  aria-label="Nome da nova categoria"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium">Emoji</span>
                <EmojiPicker
                  value={draft.emoji}
                  onChange={(emoji) => setDraft((current) => ({ ...current, emoji }))}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Cor</span>
                <ColorPicker
                  value={draft.color}
                  onChange={(color) => setDraft((current) => ({ ...current, color }))}
                  ariaLabel="Cor da nova categoria"
                />
              </div>

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {isLoading ? "Criando..." : "Criar coleção"}
              </button>
            </form>

            <div className="space-y-3">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                  Suas coleções
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Edite nome, emoji e cor. Excluir não apaga as receitas.
                </p>
              </div>

              {categories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
                  <p className="text-sm font-medium">Nenhuma categoria ainda</p>
                  <p className="mt-1 text-sm text-muted">
                    Crie a primeira coleção ao lado para organizar o livro.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {[...categories]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((category) => (
                      <CategoryRow key={category.id} category={category} onSaved={handleRefresh} />
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
