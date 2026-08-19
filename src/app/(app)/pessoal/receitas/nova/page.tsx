import Link from "next/link"
import { redirect } from "next/navigation"
import { RecipeForm } from "@/components/receitas/recipe-form"
import { ApiError } from "@/lib/api-server"
import { getRecipeCategories } from "@/lib/finance-api"

const NovaReceitaPage = async () => {
  try {
    const categories = await getRecipeCategories()

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 dark:border-border/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 px-5 py-5 text-white md:px-7 md:py-6">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <Link
                  href="/pessoal/receitas"
                  className="text-sm font-medium text-violet-200/90 transition hover:text-white"
                >
                  ← Livro de receitas
                </Link>
                <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                  Nova receita
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Preencha o básico, liste ingredientes e descreva cada passo. Depois de salvar,
                  você pode adicionar fotos e anotações.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-300">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  1 · Informações
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  2 · Ingredientes
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  3 · Preparo
                </span>
              </div>
            </div>
          </div>
        </section>

        <RecipeForm categories={categories} />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    throw error
  }
}

export default NovaReceitaPage
