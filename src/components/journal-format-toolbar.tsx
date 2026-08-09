"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import { wrapSelectionInMark, type WrapSelectionResult } from "@/lib/notebook-mark"

type JournalFormatToolbarProps = {
  editorRef: RefObject<HTMLDivElement | null>
  onMark?: (result: WrapSelectionResult) => void
}

type ToolbarShortcut = {
  key: string
  shift: boolean
  display: string
}

type ToolbarAction = {
  id: string
  label: string
  hint: string
  run: () => void
  isActive: () => boolean
  shortcut: ToolbarShortcut
}

type TooltipPosition = {
  top: number
  left: number
}

const toggleBlock = (tag: string) => {
  const current = document.queryCommandValue("formatBlock").toLowerCase()
  document.execCommand("formatBlock", false, current === tag ? "p" : tag)
}

export const JournalFormatToolbar = ({ editorRef, onMark }: JournalFormatToolbarProps) => {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [helpPosition, setHelpPosition] = useState<TooltipPosition | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      shortcut: { key: "b", shift: false, display: "⌘B" },
    },
    {
      id: "italic",
      label: "I",
      hint: "Itálico",
      run: () => document.execCommand("italic"),
      isActive: () => document.queryCommandState("italic"),
      shortcut: { key: "i", shift: false, display: "⌘I" },
    },
    {
      id: "strike",
      label: "S",
      hint: "Riscado",
      run: () => document.execCommand("strikeThrough"),
      isActive: () => document.queryCommandState("strikeThrough"),
      shortcut: { key: "x", shift: true, display: "⌘⇧X" },
    },
    {
      id: "heading",
      label: "H",
      hint: "Título",
      run: () => toggleBlock("h2"),
      isActive: () => document.queryCommandValue("formatBlock").toLowerCase() === "h2",
      shortcut: { key: "h", shift: true, display: "⌘⇧H" },
    },
    {
      id: "bullet",
      label: "•",
      hint: "Lista",
      run: () => document.execCommand("insertUnorderedList"),
      isActive: () => document.queryCommandState("insertUnorderedList"),
      shortcut: { key: "8", shift: true, display: "⌘⇧8" },
    },
    {
      id: "ordered",
      label: "1.",
      hint: "Lista numerada",
      run: () => document.execCommand("insertOrderedList"),
      isActive: () => document.queryCommandState("insertOrderedList"),
      shortcut: { key: "7", shift: true, display: "⌘⇧7" },
    },
    {
      id: "quote",
      label: "❝",
      hint: "Citação",
      run: () => toggleBlock("blockquote"),
      isActive: () => document.queryCommandValue("formatBlock").toLowerCase() === "blockquote",
      shortcut: { key: "9", shift: true, display: "⌘⇧9" },
    },
    {
      id: "mark",
      label: "M",
      hint: "Marcar trecho",
      run: () => {
        const result = wrapSelectionInMark(editorRef.current)
        if (result) onMark?.(result)
      },
      isActive: () => false,
      shortcut: { key: "m", shift: true, display: "⌘⇧M" },
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

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey
      if (!hasModifier) return

      const key = event.key.toLowerCase()
      const action = actions.find(
        (item) => item.shortcut.key === key && item.shortcut.shift === event.shiftKey
      )
      if (!action) return

      event.preventDefault()
      action.run()
      refreshActiveState()
    }

    editor.addEventListener("keydown", handleKeyDown)
    return () => editor.removeEventListener("keydown", handleKeyDown)
  })

  useEffect(() => {
    if (!isHelpOpen) return

    const updatePosition = () => {
      const button = helpButtonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const width = 240
      const gap = 8
      const viewportPadding = 12
      const estimatedHeight = 260

      let left = rect.left + rect.width / 2 - width / 2
      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - width - viewportPadding)
      )

      const spaceBelow = window.innerHeight - rect.bottom
      const top =
        spaceBelow < estimatedHeight + gap + viewportPadding
          ? Math.max(viewportPadding, rect.top - estimatedHeight - gap)
          : rect.bottom + gap

      setHelpPosition({ top, left })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)

    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [isHelpOpen])

  const handleAction = (action: ToolbarAction) => {
    focusEditor()
    action.run()
    refreshActiveState()
  }

  const openHelp = () => setIsHelpOpen(true)
  const closeHelp = () => setIsHelpOpen(false)

  const helpTooltip =
    mounted && isHelpOpen && helpPosition
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[90] w-60 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs shadow-lg shadow-slate-900/15"
            style={{ top: helpPosition.top, left: helpPosition.left }}
          >
            <p className="mb-1.5 font-semibold text-foreground">Atalhos de teclado</p>
            <ul className="space-y-1">
              {actions.map((action) => (
                <li key={action.id} className="flex items-center justify-between gap-3">
                  <span className="text-muted">{action.hint}</span>
                  <span className="font-mono text-foreground">{action.shortcut.display}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-muted">
              No Windows/Linux, use Ctrl no lugar de ⌘.
            </p>
          </div>,
          document.body
        )
      : null

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-background/60 p-1"
      role="group"
      aria-label="Formatação de texto"
      onMouseDown={(event) => event.preventDefault()}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => handleAction(action)}
          title={`${action.hint} (${action.shortcut.display})`}
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

      <button
        ref={helpButtonRef}
        type="button"
        tabIndex={0}
        onMouseEnter={openHelp}
        onMouseLeave={closeHelp}
        onFocus={openHelp}
        onBlur={closeHelp}
        className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-muted transition hover:bg-surface hover:text-foreground"
        aria-label="Ver atalhos de teclado"
      >
        ?
      </button>
      {helpTooltip}
    </div>
  )
}
