"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { Category } from "@/lib/types"
import { flattenCategories } from "@/lib/ui"

type CategorySearchSelectProps = {
  categories: Category[]
  value: string
  onValueChange: (value: string) => void
  ariaLabel: string
  allowEmpty?: boolean
  emptyLabel?: string
  placeholder?: string
  required?: boolean
}

type MenuPosition = {
  top: number
  left: number
  width: number
  maxHeight: number
  openUpward: boolean
}

export const CategorySearchSelect = ({
  categories,
  value,
  onValueChange,
  ariaLabel,
  allowEmpty = true,
  emptyLabel = "Sem categoria",
  placeholder = "Buscar categoria...",
  required = false,
}: CategorySearchSelectProps) => {
  const listboxId = useId()
  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories]
  )
  const selected = flatCategories.find((item) => item.id === value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery(selected?.title ?? "")
    }
  }, [open, selected?.title, value])

  const updateMenuPosition = () => {
    const input = inputRef.current
    if (!input) return

    const rect = input.getBoundingClientRect()
    const viewportPadding = 12
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow
    const available = openUpward ? spaceAbove : spaceBelow

    setMenuPosition({
      top: openUpward ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(240, Math.max(140, available)),
      openUpward,
    })
  }

  useEffect(() => {
    if (!open) return

    updateMenuPosition()

    const handleReposition = () => updateMenuPosition()
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("resize", handleReposition)
    window.addEventListener("scroll", handleReposition, true)
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("resize", handleReposition)
      window.removeEventListener("scroll", handleReposition, true)
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return flatCategories
    return flatCategories.filter((item) =>
      item.title.toLowerCase().includes(normalized)
    )
  }, [flatCategories, query])

  const handleOpen = () => {
    setOpen(true)
    setQuery("")
    requestAnimationFrame(() => {
      updateMenuPosition()
      inputRef.current?.focus()
    })
  }

  const handleSelect = (nextValue: string, title: string) => {
    onValueChange(nextValue)
    setQuery(title)
    setOpen(false)
  }

  const handleClear = () => {
    onValueChange("")
    setQuery("")
    setOpen(true)
    requestAnimationFrame(() => {
      updateMenuPosition()
      inputRef.current?.focus()
    })
  }

  const menu =
    open && mounted && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            className="fixed z-[100] overflow-auto rounded-xl border border-border bg-surface py-1 shadow-xl shadow-slate-300/50"
            style={{
              top: menuPosition.openUpward ? undefined : menuPosition.top,
              bottom: menuPosition.openUpward
                ? window.innerHeight - menuPosition.top
                : undefined,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
            }}
          >
            {allowEmpty ? (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  onClick={() => handleSelect("", emptyLabel)}
                  className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                    value === "" ? "bg-accent-soft font-medium text-accent" : ""
                  }`}
                >
                  {emptyLabel}
                </button>
              </li>
            ) : null}

            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">
                Nenhuma categoria encontrada
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === item.id}
                    onClick={() => handleSelect(item.id, item.title)}
                    className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                      value === item.id
                        ? "bg-accent-soft font-medium text-accent"
                        : ""
                    }`}
                    style={{ paddingLeft: `${0.75 + item.depth * 0.75}rem` }}
                  >
                    {item.title}
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body
        )
      : null

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          required={required && !value}
          value={open ? query : selected?.title ?? ""}
          placeholder={placeholder}
          onFocus={handleOpen}
          onClick={handleOpen}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!open) setOpen(true)
          }}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-3 pr-16 text-sm outline-none ring-accent placeholder:text-slate-400 focus:ring-2"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-slate-100 hover:text-foreground"
              aria-label="Limpar categoria"
            >
              Limpar
            </button>
          ) : (
            <span className="px-1 text-muted" aria-hidden="true">
              ▾
            </span>
          )}
        </div>
      </div>

      {menu}
    </div>
  )
}
