type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
