"use client"

import { IconBookmarkFlag, IconTrash } from "@/components/icons"
import type { NotebookMark } from "@/lib/types"

type MarksPanelProps = {
  marks: NotebookMark[]
  onJump: (markId: string) => void
  onDelete: (markId: string) => void
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

export const MarksPanel = ({ marks, onJump, onDelete }: MarksPanelProps) => {
  return (
    <div className="flex h-full flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <IconBookmarkFlag className="h-3.5 w-3.5" />
        Marcações
      </h2>

      <div className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto pr-1">
        {marks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-2.5 py-3 text-xs text-muted">
            Selecione um trecho e clique em &quot;M&quot; na barra de formatação para marcar.
          </p>
        ) : (
          marks.map((mark) => (
            <div
              key={mark.id}
              className="group rounded-lg border border-border/70 bg-surface px-2.5 py-2 text-xs"
            >
              <button
                type="button"
                onClick={() => onJump(mark.id)}
                className="block w-full text-left text-foreground hover:text-accent"
              >
                {mark.snippet || "Trecho marcado"}
              </button>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted">{formatTime(mark.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => onDelete(mark.id)}
                  className="hidden text-muted hover:text-danger group-hover:block"
                  aria-label="Remover marcação"
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
