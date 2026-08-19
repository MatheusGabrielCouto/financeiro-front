"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type RecipeSearchProps = {
  initialValue: string
}

export const RecipeSearch = ({ initialValue }: RecipeSearchProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setValue(initialValue), [initialValue])

  const handleChange = (next: string) => {
    setValue(next)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = next.trim()
      if (trimmed) {
        params.set("q", trimmed)
      } else {
        params.delete("q")
      }
      router.push(`/pessoal/receitas?${params.toString()}`)
    }, 350)
  }

  const handleClear = () => {
    setValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    router.push(`/pessoal/receitas?${params.toString()}`)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
        🔍
      </span>
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Buscar por nome, descrição ou ingrediente..."
        type="search"
        className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-10 text-sm outline-none ring-accent transition focus:ring-2"
        aria-label="Buscar receita"
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-1.5 py-0.5 text-xs font-medium text-muted transition hover:bg-accent-soft/60 hover:text-foreground"
          aria-label="Limpar busca"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
