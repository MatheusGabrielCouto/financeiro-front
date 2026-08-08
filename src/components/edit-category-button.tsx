"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import type { Category } from "@/lib/types"

type EditCategoryButtonProps = {
  category: Category
}

export const EditCategoryButton = ({ category }: EditCategoryButtonProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(category.title)
  const [description, setDescription] = useState(category.description ?? "")
  const [color, setColor] = useState(category.color || "#0f766e")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/category/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          color,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível atualizar"
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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
        aria-label={`Editar categoria ${category.title}`}
      >
        Editar
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-2 rounded-xl border border-border bg-surface p-3"
      aria-label={`Editar categoria ${category.title}`}
    >
      <input
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
        aria-label="Nome da categoria"
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrição"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
        aria-label="Descrição da categoria"
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        Cor
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-8 w-12 rounded border border-border"
          aria-label="Cor da categoria"
        />
      </label>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
