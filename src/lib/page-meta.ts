export type PageCrumb = {
  label: string
  href?: string
}

export type PageMeta = {
  title: string
  section: string
  crumbs: PageCrumb[]
}

export const getPageMeta = (pathname: string): PageMeta => {
  if (pathname === "/") {
    return {
      title: "Início",
      section: "Visão geral",
      crumbs: [{ label: "Início" }],
    }
  }

  if (pathname.startsWith("/dividas/nova")) {
    return {
      title: "Nova dívida",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: "/dividas" },
        { label: "Nova" },
      ],
    }
  }

  if (pathname.startsWith("/dividas/")) {
    return {
      title: "Detalhe da dívida",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: "/dividas" },
        { label: "Detalhe" },
      ],
    }
  }

  if (pathname.startsWith("/dividas")) {
    return {
      title: "Todas as dívidas",
      section: "Dívidas",
      crumbs: [{ label: "Dívidas" }],
    }
  }

  if (pathname.startsWith("/parcelas")) {
    return {
      title: "A pagar este mês",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: "/dividas" },
        { label: "A pagar" },
      ],
    }
  }

  if (pathname.startsWith("/calendario")) {
    return {
      title: "Calendário",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: "/dividas" },
        { label: "Calendário" },
      ],
    }
  }

  if (pathname.startsWith("/planejamento")) {
    return {
      title: "Planejamento",
      section: "Planejamento",
      crumbs: [{ label: "Planejamento" }],
    }
  }

  if (pathname.startsWith("/gastos-previstos")) {
    return {
      title: "Gastos previstos",
      section: "Planejamento",
      crumbs: [{ label: "Gastos previstos" }],
    }
  }

  if (pathname.startsWith("/pra-pagar")) {
    return {
      title: "Pra pagar",
      section: "Planejamento",
      crumbs: [{ label: "Pra pagar" }],
    }
  }

  if (pathname.startsWith("/planejador")) {
    return {
      title: "Planejador de dívidas",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: "/dividas" },
        { label: "Planejador" },
      ],
    }
  }

  if (pathname.startsWith("/simulador")) {
    return {
      title: "Simulador",
      section: "Dívidas",
      crumbs: [
        { label: "Dívidas", href: "/dividas" },
        { label: "Simulador" },
      ],
    }
  }

  if (pathname.startsWith("/extrato")) {
    return {
      title: "Extrato",
      section: "Visão geral",
      crumbs: [{ label: "Extrato" }],
    }
  }

  if (pathname.startsWith("/relatorios")) {
    return {
      title: "Detalhamento",
      section: "Visão geral",
      crumbs: [{ label: "Relatórios" }],
    }
  }

  if (pathname.startsWith("/insights")) {
    return {
      title: "Insights",
      section: "Visão geral",
      crumbs: [{ label: "Insights" }],
    }
  }

  if (pathname.startsWith("/notificacoes")) {
    return {
      title: "Atenção",
      section: "Visão geral",
      crumbs: [{ label: "Atenção" }],
    }
  }

  if (pathname.startsWith("/fechamento")) {
    return {
      title: "Fechamento",
      section: "Visão geral",
      crumbs: [{ label: "Fechamento" }],
    }
  }

  if (pathname.startsWith("/caixinhas")) {
    return {
      title: "Caixinhas",
      section: "Planejamento",
      crumbs: [{ label: "Caixinhas" }],
    }
  }

  if (pathname.startsWith("/recorrentes")) {
    return {
      title: "Contas fixas",
      section: "Planejamento",
      crumbs: [{ label: "Contas fixas" }],
    }
  }

  if (pathname.startsWith("/receitas-fixas")) {
    return {
      title: "Receitas fixas",
      section: "Planejamento",
      crumbs: [{ label: "Receitas fixas" }],
    }
  }

  if (pathname.startsWith("/orcamento")) {
    return {
      title: "Orçamento",
      section: "Planejamento",
      crumbs: [{ label: "Orçamento" }],
    }
  }

  if (pathname.startsWith("/categorias")) {
    return {
      title: "Categorias",
      section: "Planejamento",
      crumbs: [{ label: "Categorias" }],
    }
  }

  if (pathname.startsWith("/perfil")) {
    return {
      title: "Perfil",
      section: "Conta",
      crumbs: [{ label: "Perfil" }],
    }
  }

  if (pathname.startsWith("/interno")) {
    return {
      title: "Ferramentas internas",
      section: "Interno",
      crumbs: [{ label: "Interno" }],
    }
  }

  return {
    title: "Financeiro",
    section: "App",
    crumbs: [{ label: "Financeiro" }],
  }
}
