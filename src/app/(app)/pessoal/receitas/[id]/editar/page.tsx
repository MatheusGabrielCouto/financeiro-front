import Link from "next/link"
import { redirect } from "next/navigation"
import { RecipeForm } from "@/components/receitas/recipe-form"
import { ApiError } from "@/lib/api-server"
import { getRecipe, getRecipeCategories } from "@/lib/finance-api"

type EditarReceitaPageProps = {
  params: Promise<{ id: string }>
}

const EditarReceitaPage = async ({ params }: EditarReceitaPageProps) => {
  const { id } = await params

  try {
    const [recipe, categories] = await Promise.all([
      getRecipe(id),
      getRecipeCategories(),
    ])

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 dark:border-border/50">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 px-5 py-5 text-white md:px-7 md:py-6">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />

            <div className="relative max-w-2xl">
              <Link
                href={`/pessoal/receitas/${recipe.id}`}
                className="text-sm font-medium text-violet-200/90 transition hover:text-white"
              >
                ← Voltar para a receita
              </Link>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Editar receita
              </h1>
              <p className="mt-2 text-sm text-slate-300">{recipe.title}</p>
            </div>
          </div>
        </section>

        <RecipeForm
          categories={categories}
          initial={recipe}
          cancelHref={`/pessoal/receitas/${recipe.id}`}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login")
    }
    if (error instanceof ApiError && error.status === 404) {
      redirect("/pessoal/receitas")
    }
    throw error
  }
}

export default EditarReceitaPage
