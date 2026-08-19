import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { CategorySearchFilter } from "@/components/category-search-filter"
import { CreateCategoryForm } from "@/components/create-category-form"
import { EditCategoryButton } from "@/components/edit-category-button"
import { ProxyActionButton } from "@/components/proxy-action-button"
import { ApiError } from "@/lib/api-server"
import { getCategories } from "@/lib/finance-api"
import type { Category } from "@/lib/types"
import { flattenCategories } from "@/lib/ui"

type CategoriasPageProps = {
  searchParams: Promise<{ tipo?: string; q?: string }>
}

const countTree = (categories: Category[]) => {
  const flat = flattenCategories(categories)
  const custom = countCustom(categories)
  const withChildren = categories.filter(
    (item) => (item.children?.length ?? 0) > 0
  ).length

  return {
    total: flat.length,
    custom,
    system: flat.length - custom,
    roots: categories.length,
    withChildren,
  }
}

const countCustom = (categories: Category[]): number => {
  let total = 0
  for (const category of categories) {
    if (category.userId != null) total += 1
    if (category.children?.length) {
      total += countCustom(category.children)
    }
  }
  return total
}

const matchesTipo = (category: Category, tipo: string) => {
  if (tipo === "todas") return true
  const isSystem = category.userId == null
  return tipo === "sistema" ? isSystem : !isSystem
}

const matchesQuery = (category: Category, query: string) => {
  if (!query) return true
  const normalized = query.toLocaleLowerCase("pt-BR")
  const title = category.title.toLocaleLowerCase("pt-BR")
  const description = (category.description ?? "").toLocaleLowerCase("pt-BR")
  return title.includes(normalized) || description.includes(normalized)
}

const filterTree = (
  categories: Category[],
  tipo: string,
  query: string
): Category[] => {
  const walk = (items: Category[]): Category[] => {
    const result: Category[] = []

    for (const item of items) {
      const children = item.children ? walk(item.children) : []
      const selfMatch = matchesTipo(item, tipo) && matchesQuery(item, query)
      if (!selfMatch && children.length === 0) continue

      result.push({
        ...item,
        children,
      })
    }

    return result
  }

  return walk(categories)
}

const CategoryCard = ({
  category,
  depth = 0,
}: {
  category: Category
  depth?: number
}) => {
  const isSystem = category.userId == null
  const childCount = category.children?.length ?? 0

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-background/50 ${
        depth > 0 ? "ml-3 border-l-4 md:ml-5" : ""
      }`}
      style={
        depth > 0
          ? { borderLeftColor: category.color || "#0f766e" }
          : undefined
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: category.color || "#0f766e" }}
            aria-hidden="true"
          >
            {category.title.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold">
                {category.title}
              </h3>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  isSystem
                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-teal-50 text-accent dark:bg-teal-950/40"
                }`}
              >
                {isSystem ? "Sistema" : "Sua categoria"}
              </span>
              {depth > 0 ? (
                <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-slate-800">
                  Subcategoria
                </span>
              ) : null}
            </div>
            {category.description ? (
              <p className="mt-1 text-sm text-muted">{category.description}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {childCount > 0
                  ? `${childCount} subcategoria(s)`
                  : "Sem descrição"}
              </p>
            )}
          </div>
        </div>

        {!isSystem ? (
          <div className="flex flex-wrap items-start gap-2">
            <EditCategoryButton category={category} />
            <ProxyActionButton
              path={`/category/${category.id}`}
              method="DELETE"
              label="Excluir"
              variant="danger"
              confirmTitle="Excluir categoria"
              confirmMessage={`Você está prestes a excluir "${category.title}". Esta ação não pode ser desfeita.`}
              ariaLabel={`Excluir categoria ${category.title}`}
            />
          </div>
        ) : (
          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted dark:bg-slate-800">
            Protegida
          </span>
        )}
      </div>

      {childCount > 0 ? (
        <div className="space-y-2 border-t border-border px-3 pb-3 pt-3 md:px-4">
          {category.children!.map((child) => (
            <CategoryCard key={child.id} category={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const CategoriasPage = async ({ searchParams }: CategoriasPageProps) => {
  const params = await searchParams
  const tipo = params.tipo ?? "todas"
  const query = (params.q ?? "").trim()

  try {
    const categories = await getCategories()
    const stats = countTree(categories)
    const filtered = filterTree(categories, tipo, query)
    const filteredCount = flattenCategories(filtered).length

    const filters = [
      { id: "todas", label: "Todas" },
      { id: "minhas", label: "Minhas" },
      { id: "sistema", label: "Sistema" },
    ]

    const filterHref = (nextTipo: string) => {
      const nextParams = new URLSearchParams()
      if (nextTipo !== "todas") nextParams.set("tipo", nextTipo)
      if (query) nextParams.set("q", query)
      const qs = nextParams.toString()
      return qs ? `/financeiro/categorias?${qs}` : "/financeiro/categorias"
    }

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm shadow-slate-200/40 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Organização
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
                Categorias
              </h1>
              <p className="mt-2 text-sm text-muted">
                Organize lançamentos do extrato, limites de orçamento e contas
                fixas. Categorias do sistema vêm prontas e não podem ser
                excluídas.
              </p>
            </div>
            <Link
              href="/financeiro/orcamento"
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Ir para orçamento
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Total</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {stats.total}
              </p>
              <p className="mt-1 text-xs text-muted">
                {stats.roots} principal(is)
              </p>
            </article>
            <article className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm text-muted">Suas categorias</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent">
                {stats.custom}
              </p>
              <p className="mt-1 text-xs text-muted">criadas por você</p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-muted">Do sistema</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                {stats.system}
              </p>
              <p className="mt-1 text-xs text-muted">protegidas</p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-sm text-muted">Com subcategorias</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-success">
                {stats.withChildren}
              </p>
              <p className="mt-1 text-xs text-muted">grupos hierárquicos</p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm shadow-slate-200/40">
            <div className="space-y-3 border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Lista de categorias</h2>
                  <p className="text-sm text-muted">
                    {filteredCount} de {stats.total} categoria(s)
                    {query ? ` para “${query}”` : ""}
                  </p>
                </div>

                <div
                  className="inline-flex rounded-xl border border-border bg-slate-50 p-1 dark:bg-slate-900/50"
                  role="group"
                  aria-label="Filtrar categorias por tipo"
                >
                  {filters.map((filter) => {
                    const isActive = tipo === filter.id
                    return (
                      <Link
                        key={filter.id}
                        href={filterHref(filter.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-surface text-foreground shadow-sm"
                            : "text-muted hover:text-foreground"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {filter.label}
                      </Link>
                    )
                  })}
                </div>
              </div>

              <Suspense
                fallback={
                  <div className="h-10 max-w-md animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                }
              >
                <CategorySearchFilter initialQuery={query} />
              </Suspense>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {categories.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-14 text-center">
                  <p className="font-semibold">Nenhuma categoria disponível</p>
                  <p className="mt-1 text-sm text-muted">
                    Crie sua primeira categoria para organizar os lançamentos.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl bg-background px-4 py-12 text-center">
                  <p className="font-semibold">Nenhuma categoria encontrada</p>
                  <p className="mt-1 text-sm text-muted">
                    {query
                      ? `Nenhum resultado para “${query}”. Tente outro termo.`
                      : "Tente outro filtro ou crie uma categoria personalizada."}
                  </p>
                </div>
              ) : (
                filtered.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <CreateCategoryForm categories={categories} />

            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 dark:border-teal-900/40 dark:bg-teal-950/30">
              <p className="text-sm font-semibold text-accent">Para que serve</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                <li>Classificar gastos e entradas no Extrato.</li>
                <li>Definir limites no Orçamento por categoria.</li>
                <li>Associar Contas fixas a um tipo de despesa.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/financeiro/extrato"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Extrato
                </Link>
                <Link
                  href="/financeiro/orcamento"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Orçamento
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default CategoriasPage
