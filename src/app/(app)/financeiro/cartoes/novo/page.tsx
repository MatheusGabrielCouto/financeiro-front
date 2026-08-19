import Link from "next/link"
import { CreateCreditCardForm } from "@/components/create-credit-card-form"

const NovoCartaoPage = () => (
  <div className="space-y-5">
    <div className="max-w-2xl">
      <Link
        href="/financeiro/cartoes"
        className="text-xs font-semibold uppercase tracking-[0.14em] text-accent hover:underline"
      >
        ← Cartões
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
        Adicionar cartão
      </h1>
      <p className="mt-2 text-sm text-muted">
        Preencha os dados essenciais e veja o plástico se formar ao lado.
      </p>
    </div>
    <CreateCreditCardForm />
  </div>
)

export default NovoCartaoPage
