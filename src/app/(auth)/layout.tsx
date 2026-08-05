import type { ReactNode } from "react"

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <aside
        className="relative hidden overflow-hidden bg-[#0b3d3a] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl auth-orb" />
          <div className="absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-emerald-300/15 blur-3xl auth-orb-delayed" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#062826] to-transparent" />
        </div>

        <div className="relative z-10">
          <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight xl:text-5xl">
            Financeiro
          </p>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-teal-50/80">
            Clareza no mês, controle nas dívidas e sobra que você enxerga antes
            do fim do ciclo.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid max-w-md gap-3">
            {[
              "Parcelas e contas no mesmo panorama",
              "Caixinhas e reserva sem sair do fluxo",
              "Insights do mês com base no seu real",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 text-sm text-teal-50/85"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/25 text-[11px] font-bold text-teal-100">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-teal-100/50">
            Seu dinheiro organizado, sem complicação.
          </p>
        </div>
      </aside>

      <div className="relative flex min-h-screen flex-col justify-center bg-[linear-gradient(165deg,#f0f7f5_0%,#f8fafc_45%,#eef6f4_100%)] px-4 py-10 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,118,110,0.12) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-md auth-enter">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-white shadow-lg shadow-teal-900/15">
              F
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              Financeiro
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
