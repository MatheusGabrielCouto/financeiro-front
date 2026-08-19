"use client"

const SECTIONS = [
  { id: "ingredientes", label: "Ingredientes" },
  { id: "resumo", label: "Resumo" },
  { id: "preparo", label: "Preparo" },
  { id: "fotos", label: "Fotos" },
  { id: "anotacoes", label: "Anotações" },
  { id: "historico", label: "Histórico" },
] as const

export const RecipeDetailNav = () => {
  const handleClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    element?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav
      className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto border-b border-border/70 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Seções da receita"
    >
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => handleClick(section.id)}
          className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-semibold transition hover:bg-accent-soft/40"
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}
