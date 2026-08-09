"use client"

import { useState } from "react"
import { IconPlus, IconTrash } from "@/components/icons"
import type { NotebookPageSummary } from "@/lib/types"

type PageListProps = {
  pages: NotebookPageSummary[]
  activePageId: string | null
  isBusy: boolean
  onSelect: (id: string) => void
  onCreate: () => Promise<void>
  onDelete: (id: string, title: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

export const PageList = ({
  pages,
  activePageId,
  isBusy,
  onSelect,
  onCreate,
  onDelete,
  onMove,
}: PageListProps) => {
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await onCreate()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Páginas</h2>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || isBusy}
          className="flex h-6 w-6 items-center justify-center rounded-full text-accent transition hover:bg-accent-soft disabled:opacity-60"
          aria-label="Nova página"
        >
          <IconPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto pr-1">
        {pages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-2.5 py-3 text-xs text-muted">
            Nenhuma página ainda.
          </p>
        ) : (
          pages.map((page, index) => (
            <div
              key={page.id}
              className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition ${
                page.id === activePageId
                  ? "bg-accent-soft text-accent"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(page.id)}
                disabled={isBusy}
                className="min-w-0 flex-1 truncate text-left disabled:opacity-60"
              >
                {page.title || "Sem título"}
              </button>
              <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <button
                  type="button"
                  onClick={() => onMove(page.id, -1)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(page.id, 1)}
                  disabled={index === pages.length - 1}
                  className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(page.id, page.title)}
                  className="rounded p-0.5 text-muted hover:text-danger"
                  aria-label="Excluir página"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
