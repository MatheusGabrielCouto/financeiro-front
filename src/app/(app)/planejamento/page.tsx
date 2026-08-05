import { redirect } from "next/navigation"
import { PlannedDebtSheet } from "@/components/planned-debt-sheet"
import { ApiError } from "@/lib/api-server"
import { getCurrentMonthYear } from "@/lib/format"
import { getPlannedDebtWorkbook } from "@/lib/finance-api"

type PlanejamentoPageProps = {
  searchParams: Promise<{
    year?: string
  }>
}

const PlanejamentoPage = async ({ searchParams }: PlanejamentoPageProps) => {
  const params = await searchParams
  const current = getCurrentMonthYear()
  const year = params.year ? Number(params.year) : current.year

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    redirect(`/planejamento?year=${current.year}`)
  }

  try {
    const workbook = await getPlannedDebtWorkbook(year)

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlannedDebtSheet initialWorkbook={workbook} />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }
}

export default PlanejamentoPage
