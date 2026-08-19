import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { RecipeFavoriteButton } from "@/components/receitas/recipe-favorite-button"
import { RecipeDetailNav } from "@/components/receitas/recipe-detail-nav"
import { RecipeHistoryList } from "@/components/receitas/recipe-history-list"
import { RecipeIngredientsPanel } from "@/components/receitas/recipe-ingredients-panel"
import { RecipeNotesPanel } from "@/components/receitas/recipe-notes-panel"
import { RecipePhotoGallery } from "@/components/receitas/recipe-photo-gallery"
import { RecipeStepsPanel } from "@/components/receitas/recipe-steps-panel"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import {
  getRecipe,
  getRecipeCookHistory,
  getRecipeCookSession,
} from "@/lib/finance-api"
import { getRecipeCategoryVisual } from "@/lib/recipe-colors"
import { formatRecipeDuration, RECIPE_DIFFICULTY_LABELS } from "@/lib/recipe-labels"

type ReceitaDetailPageProps = {
  params: Promise<{ id: string }>
}

const ReceitaDetailPage = async ({ params }: ReceitaDetailPageProps) => {
  const { id } = await params

  try {
    const [recipe, history, activeSession] = await Promise.all([
      getRecipe(id),
      getRecipeCookHistory(id),
      getRecipeCookSession(id),
    ])

    const duration = formatRecipeDuration(recipe.prepMinutes, recipe.cookMinutes)
    const visual = getRecipeCategoryVisual(recipe.category?.color ?? "violet")
    const hasActiveSession = activeSession?.status === "IN_PROGRESS"

    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 dark:border-border/50">
          <div className="relative aspect-[4/3] sm:aspect-[2/1] md:aspect-[21/9]">
            {recipe.coverPhotoUrl ? (
              <Image
                src={recipe.coverPhotoUrl}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${visual.placeholder}`}
              >
                <span className="text-6xl md:text-7xl" aria-hidden>
                  {recipe.category?.emoji ?? "🍽️"}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />

            <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6">
              <RecipeFavoriteButton
                recipeId={recipe.id}
                isFavorite={recipe.isFavorite}
                variant="detail"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
              <Link
                href="/pessoal/receitas"
                className="text-sm font-medium text-violet-200/90 transition hover:text-white"
              >
                ← Livro de receitas
              </Link>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  {recipe.category ? (
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      {recipe.category.emoji} {recipe.category.name}
                    </span>
                  ) : null}
                  <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-4xl">
                    {recipe.title}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/pessoal/receitas/${recipe.id}/preparar`}
                    className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                  >
                    {hasActiveSession ? "Continuar preparo" : "Iniciar preparo"}
                  </Link>
                  <Link
                    href={`/pessoal/receitas/${recipe.id}/editar`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/15"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasActiveSession ? (
          <Link
            href={`/pessoal/receitas/${recipe.id}/preparar`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft/40 px-4 py-3 transition hover:bg-accent-soft/60"
          >
            <span className="text-sm font-semibold text-accent">
              Preparo em andamento — toque para continuar
            </span>
            <span className="text-sm font-semibold text-accent">→</span>
          </Link>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {duration ? (
            <span className="rounded-full border border-border/80 bg-surface px-3 py-1.5 text-sm">
              <span className="text-muted">Tempo · </span>
              <span className="font-semibold">{duration}</span>
            </span>
          ) : null}
          {recipe.servings ? (
            <span className="rounded-full border border-border/80 bg-surface px-3 py-1.5 text-sm">
              <span className="text-muted">Porções · </span>
              <span className="font-semibold">{recipe.servings}</span>
            </span>
          ) : null}
          {recipe.difficulty ? (
            <span className="rounded-full border border-border/80 bg-surface px-3 py-1.5 text-sm">
              <span className="text-muted">Dificuldade · </span>
              <span className="font-semibold">
                {RECIPE_DIFFICULTY_LABELS[recipe.difficulty]}
              </span>
            </span>
          ) : null}
          <span className="rounded-full border border-border/80 bg-surface px-3 py-1.5 text-sm">
            <span className="text-muted">Preparada · </span>
            <span className="font-semibold">{recipe.timesCooked}x</span>
          </span>
          {recipe.isFavorite ? (
            <span className="rounded-full border border-amber-300/50 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
              ★ Favorita
            </span>
          ) : null}
          <span className="rounded-full border border-border/80 bg-surface px-3 py-1.5 text-sm">
            <span className="text-muted">Ingredientes · </span>
            <span className="font-semibold">{recipe.ingredients.length}</span>
          </span>
        </div>

        <RecipeDetailNav />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
          <div className="space-y-8 xl:order-1">
            <section
              id="resumo"
              className="scroll-mt-24 space-y-3 rounded-2xl border border-border/70 bg-surface p-5 md:p-6"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Sobre a receita
              </h2>
              {recipe.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {recipe.description}
                </p>
              ) : (
                <p className="text-sm text-muted">Sem descrição cadastrada.</p>
              )}
            </section>

            <div id="ingredientes" className="scroll-mt-24 xl:hidden">
              <RecipeIngredientsPanel
                ingredients={recipe.ingredients}
                categoryColor={recipe.category?.color}
              />
            </div>

            <div className="scroll-mt-24">
              <RecipeStepsPanel steps={recipe.steps} />
            </div>

            <section
              id="fotos"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface p-5 md:p-6"
            >
              <RecipePhotoGallery
                recipeId={recipe.id}
                photos={recipe.photos}
                coverPhotoId={recipe.coverPhotoId}
              />
            </section>

            <section
              id="anotacoes"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface p-5 md:p-6"
            >
              <RecipeNotesPanel recipeId={recipe.id} notes={recipe.notes} />
            </section>

            <section
              id="historico"
              className="scroll-mt-24 space-y-4 rounded-2xl border border-border/70 bg-surface p-5 md:p-6"
            >
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                  Histórico de preparos
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Cada vez que você conclui o modo preparo
                </p>
              </div>
              <RecipeHistoryList history={history} />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
              <ProxyActionButton
                path={`/recipe/${recipe.id}`}
                method="DELETE"
                label="Excluir receita"
                confirmTitle="Excluir receita"
                confirmMessage={`Excluir "${recipe.title}" permanentemente?`}
                variant="danger"
                ariaLabel={`Excluir receita ${recipe.title}`}
                redirectTo="/pessoal/receitas"
              />
            </div>
          </div>

          <aside id="ingredientes" className="hidden scroll-mt-24 space-y-4 xl:order-2 xl:sticky xl:top-24 xl:block">
            <RecipeIngredientsPanel
              ingredients={recipe.ingredients}
              categoryColor={recipe.category?.color}
            />

            <Link
              href={`/pessoal/receitas/${recipe.id}/preparar`}
              className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              {hasActiveSession ? "Continuar preparo" : "Iniciar preparo"}
            </Link>
          </aside>
        </div>
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

export default ReceitaDetailPage
