"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { IconTrash } from "@/components/icons"
import { formatDate } from "@/lib/format"
import type { RecipeNote } from "@/lib/types"

type RecipeNotesPanelProps = {
  recipeId: string
  notes: RecipeNote[]
}

export const RecipeNotesPanel = ({ recipeId, notes }: RecipeNotesPanelProps) => {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/proxy/recipe/${recipeId}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!response.ok) {
        setError("Erro ao salvar anotação")
        return
      }
      setContent("")
      router.refresh()
    } catch {
      setError("Erro ao salvar anotação")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/proxy/recipe/${recipeId}/note/${noteId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        setError("Erro ao remover anotação")
        return
      }
      router.refresh()
    } catch {
      setError("Erro ao remover anotação")
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Anotações
        </h2>
        <p className="mt-1 text-sm text-muted">
          Observações, ajustes e lembretes sobre a receita
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          placeholder="Ex.: Dobrei a quantidade de açúcar e ficou melhor..."
          aria-label="Nova anotação"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isLoading ? "Salvando..." : "Adicionar anotação"}
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {notes.length === 0 ? (
        <div className="panel-soft rounded-xl px-4 py-8 text-center">
          <p className="text-sm text-muted">Nenhuma anotação ainda</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="panel-soft rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{formatDate(note.createdAt)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{note.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted"
                  aria-label="Remover anotação"
                  tabIndex={0}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
