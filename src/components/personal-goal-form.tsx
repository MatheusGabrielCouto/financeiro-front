"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

export const PersonalGoalForm = () => {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [unit, setUnit] = useState("")
  const [target, setTarget] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const targetValue = Number(target.replace(",", "."))

    if (!title.trim()) {
      setError("Informe um título")
      return
    }
    if (!unit.trim()) {
      setError("Informe uma unidade (ex.: livros, km)")
      return
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError("Informe um alvo válido")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/personal-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          unit: unit.trim(),
          target: targetValue,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível salvar a meta"
        )
        return
      }

      setTitle("")
      setUnit("")
      setTarget("")
      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Nova meta pessoal">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Título</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Ler livros no ano"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
          aria-label="Título da meta"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Unidade</span>
          <input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="livros, km..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Unidade da meta"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Alvo</span>
          <input
            inputMode="decimal"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="12"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
            aria-label="Valor alvo da meta"
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isLoading ? "Salvando..." : "Criar meta"}
      </button>
    </form>
  )
}
