"use client"

import { useState, type FormEvent } from "react"
import { IconPlus, IconTrash } from "@/components/icons"
import {
  getNotebookColorTokens,
  NOTEBOOK_COLOR_OPTIONS,
  type NotebookColorToken,
} from "@/lib/notebook-colors"
import type { Notebook } from "@/lib/types"

type NotebookShelfProps = {
  notebooks: Notebook[]
  activeNotebookId: string | null
  isBusy: boolean
  onSelect: (id: string) => void
  onCreate: (data: { title: string; emoji: string; color: NotebookColorToken }) => Promise<void>
  onDelete: (id: string, title: string) => void
}

const EMOJI_OPTIONS = ["📓", "📗", "📘", "📙", "📕", "🧾", "✏️", "🎓"]

export const NotebookShelf = ({
  notebooks,
  activeNotebookId,
  isBusy,
  onSelect,
  onCreate,
  onDelete,
}: NotebookShelfProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0])
  const [color, setColor] = useState<NotebookColorToken>("amber")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setIsSaving(true)
    try {
      await onCreate({ title: title.trim(), emoji, color })
      setTitle("")
      setEmoji(EMOJI_OPTIONS[0])
      setColor("amber")
      setIsCreating(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {notebooks.map((notebook) => {
        const tokens = getNotebookColorTokens(notebook.color)
        const active = notebook.id === activeNotebookId
        return (
          <div
            key={notebook.id}
            className={`group flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1.5 text-sm font-medium transition ${
              active
                ? `border-transparent ${tokens.bg} ${tokens.text} shadow-sm`
                : "border-border/70 bg-surface text-foreground hover:border-accent/40"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(notebook.id)}
              disabled={isBusy}
              className="flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden="true">{notebook.emoji}</span>
              <span className="font-[family-name:var(--font-fraunces)]">{notebook.title}</span>
              <span className={active ? "text-xs opacity-80" : "text-xs text-muted"}>
                {notebook.pageCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(notebook.id, notebook.title)}
              disabled={isBusy}
              aria-label={`Excluir caderno ${notebook.title}`}
              className={`hidden rounded-full p-1 transition group-hover:block disabled:cursor-not-allowed ${
                active ? "hover:bg-black/10" : "text-muted hover:bg-danger/10 hover:text-danger"
              }`}
            >
              <IconTrash className="h-3 w-3" />
            </button>
          </div>
        )
      })}

      {isCreating ? (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full border border-dashed border-accent/50 bg-surface px-3 py-1.5"
        >
          <select
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            className="bg-transparent text-sm outline-none"
            aria-label="Emoji do caderno"
          >
            {EMOJI_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome do caderno"
            className="w-28 bg-transparent text-sm outline-none placeholder:text-muted sm:w-36"
          />
          <div className="flex items-center gap-1">
            {NOTEBOOK_COLOR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Cor ${option}`}
                className={`h-4 w-4 rounded-full ${getNotebookColorTokens(option).bg} ${
                  color === option ? "ring-2 ring-offset-1 ring-accent" : ""
                }`}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={isSaving || !title.trim()}
            className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {isSaving ? "..." : "Criar"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="text-xs text-muted hover:text-foreground"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Novo caderno
        </button>
      )}
    </div>
  )
}
