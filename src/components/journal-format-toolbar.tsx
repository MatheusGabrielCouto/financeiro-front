"use client"

import { useEffect, useState, type RefObject } from "react"

type JournalFormatToolbarProps = {
  editorRef: RefObject<HTMLDivElement | null>
}

type ToolbarAction = {
  id: string
  label: string
  hint: string
  run: () => void
  isActive: () => boolean
}

const toggleBlock = (tag: string) => {
  const current = document.queryCommandValue("formatBlock").toLowerCase()
  document.execCommand("formatBlock", false, current === tag ? "p" : tag)
}

export const JournalFormatToolbar = ({ editorRef }: JournalFormatToolbarProps) => {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())

  const focusEditor = () => {
    editorRef.current?.focus()
  }

  const actions: ToolbarAction[] = [
    {
      id: "bold",
      label: "B",
      hint: "Negrito",
      run: () => document.execCommand("bold"),
      isActive: () => document.queryCommandState("bold"),
    },
    {
      id: "italic",
      label: "I",
      hint: "Itálico",
      run: () => document.execCommand("italic"),
      isActive: () => document.queryCommandState("italic"),
    },
    {
      id: "strike",
      label: "S",
      hint: "Riscado",
      run: () => document.execCommand("strikeThrough"),
      isActive: () => document.queryCommandState("strikeThrough"),
    },
    {
      id: "heading",
      label: "H",
      hint: "Título",
      run: () => toggleBlock("h2"),
      isActive: () => document.queryCommandValue("formatBlock").toLowerCase() === "h2",
    },
    {
      id: "bullet",
      label: "•",
      hint: "Lista",
      run: () => document.execCommand("insertUnorderedList"),
      isActive: () => document.queryCommandState("insertUnorderedList"),
    },
    {
      id: "ordered",
      label: "1.",
      hint: "Lista numerada",
      run: () => document.execCommand("insertOrderedList"),
      isActive: () => document.queryCommandState("insertOrderedList"),
    },
    {
      id: "quote",
      label: "❝",
      hint: "Citação",
      run: () => toggleBlock("blockquote"),
      isActive: () => document.queryCommandValue("formatBlock").toLowerCase() === "blockquote",
    },
  ]

  const refreshActiveState = () => {
    const editor = editorRef.current
    if (!editor) return
    const selection = document.getSelection()
    if (!selection || selection.rangeCount === 0) return
    if (!editor.contains(selection.anchorNode)) return

    const next = new Set<string>()
    for (const action of actions) {
      if (action.isActive()) next.add(action.id)
    }
    setActiveIds(next)
  }

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActiveState)
    return () => document.removeEventListener("selectionchange", refreshActiveState)
  })

  const handleAction = (action: ToolbarAction) => {
    focusEditor()
    action.run()
    refreshActiveState()
  }

  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-background/60 p-1"
      role="group"
      aria-label="Formatação de texto"
      onMouseDown={(event) => event.preventDefault()}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => handleAction(action)}
          title={action.hint}
          aria-label={action.hint}
          aria-pressed={activeIds.has(action.id)}
          className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
            activeIds.has(action.id)
              ? "bg-accent-soft text-accent"
              : "text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
