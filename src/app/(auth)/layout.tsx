import type { ReactNode } from "react"
import { NexoMark } from "@/components/nexo-mark"

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <aside
        className="relative hidden overflow-hidden bg-[#0a0a13] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl auth-orb" />
          <div className="absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-cyan-300/15 blur-3xl auth-orb-delayed" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a13] to-transparent" />
        </div>

        <div className="relative z-10">
          <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight xl:text-5xl">
            Nexo
          </p>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-violet-50/80">
            Tudo o que importa, num nexo. Um hub pessoal onde o financeiro é só
            mais um módulo — junto de estudos, rotinas e o que você adicionar.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid max-w-md gap-3">
            {[
              "Financeiro: dívidas, contas e caixinhas num painel só",
              "Estudos, rotinas e diário no mesmo login",
              "Novos módulos entram sem trocar de app",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 text-sm text-violet-50/85"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400/25 text-[11px] font-bold text-violet-100">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-violet-100/50">
            Seu assistente pessoal, organizado por módulo.
          </p>
        </div>
      </aside>

      <div
        className="relative flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8"
        style={{ background: "var(--auth-panel-gradient)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--auth-dot-color) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-md auth-enter">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20">
              <NexoMark className="h-5 w-5" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Nexo
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
