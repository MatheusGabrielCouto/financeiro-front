import { redirect } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getStoredUser, isOnboardingDone } from "@/lib/auth-cookies"
import { getRecurringIncomes } from "@/lib/finance-api"
import { ApiError } from "@/lib/api-server"

const OnboardingPage = async () => {
  const user = await getStoredUser()
  if (!user) redirect("/login")

  const done = await isOnboardingDone()
  if (done) redirect("/")

  try {
    const incomes = await getRecurringIncomes()
    if (incomes.length > 0) {
      redirect("/api/onboarding/complete?from=/")
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout")
    }
    throw error
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(165deg,#0b3d3a_0%,#0f766e_42%,#134e4a_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl auth-orb" />
        <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-emerald-200/15 blur-3xl auth-orb-delayed" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#062826] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-4 py-10 md:py-14">
        <header className="mb-8 auth-enter">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Financeiro
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-teal-50/75">
            Configuração inicial para deixar o mês previsível desde o primeiro
            acesso.
          </p>
        </header>

        <OnboardingWizard userName={user.name} />
      </div>
    </div>
  )
}

export default OnboardingPage
