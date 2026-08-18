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
  IconRecurring,
  IconReports,
  IconRoutine,
  IconSimulate,
  IconStudy,
  IconTarget,
  IconTransactions,
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
  modules: AppModule[]
}

export const AREAS: Area[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    modules: [
      {
        id: "visao-geral",
        label: "Visão geral",
        description: "Saldo, extrato e panorama do mês",
        icon: IconOverview,
        accent: "violet",
        href: "/",
        navItems: [
          { href: "/", label: "Início", icon: IconOverview },
          { href: "/extrato", label: "Extrato", icon: IconTransactions },
          { href: "/relatorios", label: "Relatórios", icon: IconReports },
          { href: "/insights", label: "Insights", icon: IconInsights },
          { href: "/notificacoes", label: "Atenção", icon: IconBell },
          { href: "/fechamento", label: "Fechamento", icon: IconReports },
        ],
      },
      {
        id: "dividas",
        label: "Dívidas",
        description: "Parcelas, cartões e planejador",
        icon: IconDebts,
        accent: "rose",
        href: "/dividas",
        navItems: [
          { href: "/dividas", label: "Todas as dívidas", icon: IconDebts },
          { href: "/parcelas", label: "A pagar este mês", icon: IconInstallments },
          { href: "/calendario", label: "Calendário", icon: IconInstallments },
          { href: "/cartoes", label: "Cartões", icon: IconCreditCard },
          { href: "/planejador", label: "Planejador", icon: IconDebts },
          { href: "/simulador", label: "Simulador", icon: IconSimulate },
        ],
      },
      {
        id: "planejamento",
        label: "Planejamento",
        description: "Orçamento, caixinhas e contas fixas",
        icon: IconBudget,
        accent: "amber",
        href: "/planejamento",
        navItems: [
          { href: "/planejamento", label: "Planilha", icon: IconReports },
          { href: "/pra-pagar", label: "Pra pagar", icon: IconInstallments },
          { href: "/gastos-previstos", label: "Gastos previstos", icon: IconInstallments },
          { href: "/caixinhas", label: "Caixinhas", icon: IconPiggy },
          { href: "/recorrentes", label: "Contas fixas", icon: IconRecurring },
          { href: "/receitas-fixas", label: "Receitas fixas", icon: IconTransactions },
          { href: "/orcamento", label: "Orçamento", icon: IconBudget },
          { href: "/categorias", label: "Categorias", icon: IconCategory },
        ],
      },
    ],
  },
  {
    id: "pessoal",
    label: "Pessoal",
    modules: [
      {
        id: "estudos",
        label: "Estudos",
        description: "Matérias e sessões de estudo",
        icon: IconStudy,
        accent: "sky",
        href: "/estudos",
        navItems: [{ href: "/estudos", label: "Estudos", icon: IconStudy }],
      },
      {
        id: "rotinas",
        label: "Rotinas",
        description: "Hábitos e check-in diário",
        icon: IconRoutine,
        accent: "emerald",
        href: "/rotinas",
        navItems: [{ href: "/rotinas", label: "Rotinas", icon: IconRoutine }],
      },
      {
        id: "diario",
        label: "Diário",
        description: "Notas rápidas do dia a dia",
        icon: IconJournal,
        accent: "indigo",
        href: "/diario",
        navItems: [{ href: "/diario", label: "Diário", icon: IconJournal }],
      },
      {
        id: "metas-pessoais",
        label: "Metas",
        description: "Progresso em metas não financeiras",
        icon: IconTarget,
        accent: "fuchsia",
        href: "/metas-pessoais",
        navItems: [{ href: "/metas-pessoais", label: "Metas", icon: IconTarget }],
      },
      {
        id: "remedios",
        label: "Remédios",
        description: "Doses e horários",
        icon: IconPill,
        accent: "orange",
        href: "/remedios",
        navItems: [{ href: "/remedios", label: "Remédios", icon: IconPill }],
      },
      {
        id: "cadernos",
        label: "Cadernos",
        description: "Anotações e cadernos livres",
        icon: IconNotebook,
        accent: "cyan",
        href: "/cadernos",
        navItems: [{ href: "/cadernos", label: "Cadernos", icon: IconNotebook }],
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
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)

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
