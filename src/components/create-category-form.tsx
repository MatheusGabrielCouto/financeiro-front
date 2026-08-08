"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import type { Category } from "@/lib/types"
import { flattenCategories } from "@/lib/ui"

type CreateCategoryFormProps = {
  categories: Category[]
}

const COLOR_PRESETS = [
  "#0f766e",
  "#0369a1",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#475569",
]

export const CreateCategoryForm = ({ categories }: CreateCategoryFormProps) => {
  const router = useRouter()
  const parents = useMemo(() => flattenCategories(categories), [categories])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [parentId, setParentId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/proxy/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          color,
          parentId: parentId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível criar a categoria"
        )
        return
      }

      setTitle("")
      setDescription("")
      setParentId("")
      setColor(COLOR_PRESETS[0])
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40"
      aria-label="Nova categoria"
    >
      <div>
        <h2 className="text-base font-semibold">Nova categoria</h2>
        <p className="mt-1 text-sm text-muted">
          Use no extrato, orçamento e contas fixas.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Mercado, Transporte"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Nome da categoria"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Descrição</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Opcional"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Descrição da categoria"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Categoria pai</span>
        <select
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Categoria pai opcional"
        >
          <option value="">Nenhuma (categoria principal)</option>
          {parents.map((item) => (
            <option key={item.id} value={item.id}>
              {"—".repeat(item.depth)} {item.title}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Cor</span>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isActive = color.toLowerCase() === preset.toLowerCase()
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  isActive
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: preset }}
                aria-label={`Selecionar cor ${preset}`}
                aria-pressed={isActive}
              />
            )
          })}
          <label className="ml-1 flex items-center gap-2 text-xs text-muted">
            <span>Outra</span>
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-background p-0.5"
              aria-label="Escolher cor personalizada"
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        aria-label="Salvar categoria"
      >
        {isLoading ? "Salvando..." : "Criar categoria"}
      </button>
    </form>
  )
}
