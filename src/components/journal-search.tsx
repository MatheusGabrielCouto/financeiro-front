"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type JournalSearchProps = {
  basePath: string
  initialValue: string
}

export const JournalSearch = ({ basePath, initialValue }: JournalSearchProps) => {
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
      if (next.trim()) {
        params.set("search", next.trim())
      } else {
        params.delete("search")
      }
      params.delete("date")
      router.push(`${basePath}?${params.toString()}`)
    }, 350)
  }

  return (
    <label className="block">
      <span className="sr-only">Buscar no diário</span>
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Buscar no diário..."
        type="search"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
        aria-label="Buscar no diário"
      />
    </label>
  )
}
