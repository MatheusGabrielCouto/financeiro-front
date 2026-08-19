import type { ComponentType } from "react"
import {
  IconBell,
  IconBudget,
  IconCategory,
  IconCreditCard,
  IconDebts,
  IconInstallments,
  IconInsights,
  IconJournal,
  IconNotebook,
  IconOverview,
  IconPiggy,
  IconPill,
  IconRecipe,
  IconRecurring,
  IconReports,
  IconRoutine,
  IconSimulate,
  IconStudy,
  IconTarget,
  IconTransactions,
  IconUser,
} from "@/components/icons"

export type IconComponent = ComponentType<{ className?: string }>

export type ModuleAccentToken =
  | "violet"
  | "cyan"
  | "sky"
  | "indigo"
  | "fuchsia"
  | "rose"
  | "amber"
  | "orange"
  | "emerald"

export type NavItem = {
  href: string
  label: string
  icon: IconComponent
}

export type AppModule = {
  id: string
  label: string
  description: string
  icon: IconComponent
  accent: ModuleAccentToken
  href: string
  navItems: NavItem[]
}

export type Area = {
  id: string
  label: string
  icon: IconComponent
  homeHref: string
  modules: AppModule[]
}

export const AREAS: Area[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    icon: IconOverview,
    homeHref: "/financeiro",
    modules: [
      {
        id: "visao-geral",
        label: "Visão geral",
        description: "Saldo, extrato e panorama do mês",
        icon: IconOverview,
        accent: "violet",
        href: "/financeiro",
        navItems: [
          { href: "/financeiro", label: "Início", icon: IconOverview },
          { href: "/financeiro/extrato", label: "Extrato", icon: IconTransactions },
          { href: "/financeiro/relatorios", label: "Relatórios", icon: IconReports },
          { href: "/financeiro/insights", label: "Insights", icon: IconInsights },
          { href: "/financeiro/notificacoes", label: "Atenção", icon: IconBell },
          { href: "/financeiro/fechamento", label: "Fechamento", icon: IconReports },
        ],
      },
      {
        id: "dividas",
        label: "Dívidas",
        description: "Parcelas, cartões e planejador",
        icon: IconDebts,
        accent: "rose",
        href: "/financeiro/dividas",
        navItems: [
          { href: "/financeiro/dividas", label: "Todas as dívidas", icon: IconDebts },
          { href: "/financeiro/parcelas", label: "A pagar este mês", icon: IconInstallments },
          { href: "/financeiro/calendario", label: "Calendário", icon: IconInstallments },
          { href: "/financeiro/cartoes", label: "Cartões", icon: IconCreditCard },
          { href: "/financeiro/planejador", label: "Planejador", icon: IconDebts },
          { href: "/financeiro/simulador", label: "Simulador", icon: IconSimulate },
        ],
      },
      {
        id: "planejamento",
        label: "Planejamento",
        description: "Orçamento, caixinhas e contas fixas",
        icon: IconBudget,
        accent: "amber",
        href: "/financeiro/planejamento",
        navItems: [
          { href: "/financeiro/planejamento", label: "Planilha", icon: IconReports },
          { href: "/financeiro/pra-pagar", label: "Pra pagar", icon: IconInstallments },
          { href: "/financeiro/gastos-previstos", label: "Gastos previstos", icon: IconInstallments },
          { href: "/financeiro/caixinhas", label: "Caixinhas", icon: IconPiggy },
          { href: "/financeiro/recorrentes", label: "Contas fixas", icon: IconRecurring },
          { href: "/financeiro/receitas-fixas", label: "Receitas fixas", icon: IconTransactions },
          { href: "/financeiro/orcamento", label: "Orçamento", icon: IconBudget },
          { href: "/financeiro/categorias", label: "Categorias", icon: IconCategory },
        ],
      },
    ],
  },
  {
    id: "pessoal",
    label: "Pessoal",
    icon: IconUser,
    homeHref: "/pessoal",
    modules: [
      {
        id: "visao-geral-pessoal",
        label: "Início",
        description: "Seus módulos pessoais, num painel só",
        icon: IconOverview,
        accent: "violet",
        href: "/pessoal",
        navItems: [{ href: "/pessoal", label: "Início", icon: IconOverview }],
      },
      {
        id: "estudos",
        label: "Estudos",
        description: "Matérias e sessões de estudo",
        icon: IconStudy,
        accent: "sky",
        href: "/pessoal/estudos",
        navItems: [{ href: "/pessoal/estudos", label: "Estudos", icon: IconStudy }],
      },
      {
        id: "rotinas",
        label: "Rotinas",
        description: "Hábitos e check-in diário",
        icon: IconRoutine,
        accent: "emerald",
        href: "/pessoal/rotinas",
        navItems: [{ href: "/pessoal/rotinas", label: "Rotinas", icon: IconRoutine }],
      },
      {
        id: "diario",
        label: "Diário",
        description: "Notas rápidas do dia a dia",
        icon: IconJournal,
        accent: "indigo",
        href: "/pessoal/diario",
        navItems: [{ href: "/pessoal/diario", label: "Diário", icon: IconJournal }],
      },
      {
        id: "metas-pessoais",
        label: "Metas",
        description: "Progresso em metas não financeiras",
        icon: IconTarget,
        accent: "fuchsia",
        href: "/pessoal/metas-pessoais",
        navItems: [{ href: "/pessoal/metas-pessoais", label: "Metas", icon: IconTarget }],
      },
      {
        id: "remedios",
        label: "Remédios",
        description: "Doses e horários",
        icon: IconPill,
        accent: "orange",
        href: "/pessoal/remedios",
        navItems: [{ href: "/pessoal/remedios", label: "Remédios", icon: IconPill }],
      },
      {
        id: "receitas",
        label: "Receitas",
        description: "Livro de receitas com modo preparo",
        icon: IconRecipe,
        accent: "violet",
        href: "/pessoal/receitas",
        navItems: [{ href: "/pessoal/receitas", label: "Receitas", icon: IconRecipe }],
      },
      {
        id: "cadernos",
        label: "Cadernos",
        description: "Anotações e cadernos livres",
        icon: IconNotebook,
        accent: "cyan",
        href: "/pessoal/cadernos",
        navItems: [{ href: "/pessoal/cadernos", label: "Cadernos", icon: IconNotebook }],
      },
    ],
  },
]

export const ALL_MODULES: AppModule[] = AREAS.flatMap((area) => area.modules)

export const findAreaByModuleId = (moduleId: string): Area | undefined =>
  AREAS.find((area) => area.modules.some((appModule) => appModule.id === moduleId))

export const findModuleById = (moduleId: string): AppModule | undefined =>
  ALL_MODULES.find((appModule) => appModule.id === moduleId)

const isPathMatch = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

export const findAreaByHref = (pathname: string): Area | undefined =>
  AREAS.find((area) => pathname === area.homeHref || pathname.startsWith(`${area.homeHref}/`))

export const findModuleByHref = (pathname: string): AppModule | undefined => {
  let best: AppModule | undefined
  let bestLength = -1
  for (const appModule of ALL_MODULES) {
    for (const item of appModule.navItems) {
      if (isPathMatch(pathname, item.href) && item.href.length > bestLength) {
        best = appModule
        bestLength = item.href.length
      }
    }
  }
  return best
}

export const findNavItem = (href: string): NavItem | undefined => {
  for (const appModule of ALL_MODULES) {
    const item = appModule.navItems.find((navItem) => navItem.href === href)
    if (item) return item
  }
  return undefined
}
