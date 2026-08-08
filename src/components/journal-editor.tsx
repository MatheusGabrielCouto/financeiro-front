"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { JournalFormatToolbar } from "@/components/journal-format-toolbar"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { MOOD_OPTIONS } from "@/lib/journal-mood"

type JournalEditorProps = {
  date: string
  dateLabel: string
  isToday: boolean
  initialContent: string
  initialMood: number | null
  hasEntry: boolean
}

export const JournalEditor = ({
  date,
  dateLabel,
  isToday,
  initialContent,
  initialMood,
  hasEntry,
}: JournalEditorProps) => {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const [mood, setMood] = useState<number | null>(initialMood)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMood(initialMood)
    setError(null)
  }, [date, initialMood])

  const handleFocus = () => {
    document.execCommand("defaultParagraphSeparator", false, "p")
  }

  const handleSubmit = async () => {
    setError(null)
    const content = editorRef.current?.innerHTML ?? ""
    const plainText = editorRef.current?.innerText.trim() ?? ""

    if (!plainText) {
      setError("Escreva algo antes de salvar")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/proxy/journal/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mood }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar a entrada"
        )
        return
      }

      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4" aria-label="Entrada do diário">
      <div>
        <p className="text-sm font-semibold">{isToday ? "Hoje" : dateLabel}</p>
        {!isToday ? (
          <p className="text-xs text-muted">Editando entrada de {dateLabel}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Como foi o dia?</span>
        <JournalFormatToolbar editorRef={editorRef} />
        <div
          key={date}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          data-placeholder="Escreva livremente..."
          dangerouslySetInnerHTML={{ __html: initialContent }}
          className="prose-journal min-h-[176px] w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Conteúdo da entrada"
          role="textbox"
          aria-multiline="true"
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Humor (opcional)</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Selecionar humor">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setMood((current) => (current === option.value ? null : option.value))
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                mood === option.value
                  ? "scale-110 bg-accent-soft ring-2 ring-accent"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={option.label}
              aria-pressed={mood === option.value}
              title={option.label}
            >
              {option.emoji}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {isLoading ? "Salvando..." : "Salvar entrada"}
        </button>
        {hasEntry ? (
          <ProxyActionButton
            path={`/journal/${date}`}
            method="DELETE"
            label="Excluir"
            loadingLabel="Excluindo..."
            confirmTitle="Excluir entrada"
            confirmMessage={`Excluir a entrada de ${dateLabel}?`}
            variant="danger"
            ariaLabel={`Excluir entrada de ${dateLabel}`}
          />
        ) : null}
      </div>
    </div>
  )
}
