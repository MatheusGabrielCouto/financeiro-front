import { IconCreditCard, IconDebts, IconUser } from "@/components/icons"
import type { IconComponent } from "@/lib/nav-registry"
import { findAreaByModuleId, findModuleByHref } from "@/lib/nav-registry"

export type PageCrumb = {
  label: string
  href?: string
  icon?: IconComponent
}

export type PageMeta = {
  title: string
  section: string
  crumbs: PageCrumb[]
}

const DIVIDAS_HREF = "/dividas"
const CARTOES_HREF = "/cartoes"

export const getPageMeta = (pathname: string): PageMeta => {
  // Rotas dinâmicas/multi-nível que o registro plano de módulos não modela.
  if (pathname.startsWith("/dividas/nova")) {
    return {
      title: "Nova dívida",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: DIVIDAS_HREF, icon: IconDebts },
        { label: "Nova" },
      ],
    }
  }

  if (pathname.startsWith("/dividas/")) {
    return {
      title: "Detalhe da dívida",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: DIVIDAS_HREF, icon: IconDebts },
        { label: "Detalhe" },
      ],
    }
  }

  if (pathname.startsWith("/cartoes/novo")) {
    return {
      title: "Novo cartão",
      section: "Dívidas",
      crumbs: [
        { label: "Cartões", href: CARTOES_HREF, icon: IconCreditCard },
        { label: "Novo" },
      ],
    }
  }

  if (pathname.startsWith("/cartoes/")) {
    return {
      title: "Detalhe do cartão",
      section: "Dívidas",
      crumbs: [
        { label: "Cartões", href: CARTOES_HREF, icon: IconCreditCard },
        { label: "Detalhe" },
      ],
    }
  }

  if (pathname.startsWith("/perfil")) {
    return {
      title: "Perfil",
      section: "Conta",
      crumbs: [{ label: "Perfil", icon: IconUser }],
    }
  }

  if (pathname.startsWith("/interno")) {
    return {
      title: "Ferramentas internas",
      section: "Interno",
      crumbs: [{ label: "Interno" }],
    }
  }

  const appModule = findModuleByHref(pathname)
  if (appModule) {
    const item =
      appModule.navItems.find(
        (navItem) =>
          pathname === navItem.href || pathname.startsWith(`${navItem.href}/`)
      ) ?? appModule.navItems[0]
    const area = findAreaByModuleId(appModule.id)
    const isModuleRoot = item.href === appModule.href

    return {
      title: item.label,
      section: area?.label ?? appModule.label,
      crumbs: isModuleRoot
        ? [{ label: item.label, icon: item.icon }]
        : [
            { label: appModule.label, href: appModule.href, icon: appModule.icon },
            { label: item.label, icon: item.icon },
          ],
    }
  }

  return {
    title: "Nexo",
    section: "App",
    crumbs: [{ label: "Nexo" }],
  }
}
