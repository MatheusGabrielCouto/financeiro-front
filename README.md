# Financeiro Front

Dashboard web (MVP) para acompanhamento de dívidas, consumindo a API do `financeiro-back`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Autenticação via cookies `httpOnly` (access + refresh), sem tokens no `localStorage`
- Proxy autenticado em `/api/proxy/*`

## Pré-requisitos

1. PostgreSQL rodando (via Docker no back)
2. API NestJS em `http://localhost:3333`

## Subir o backend

```bash
cd ../financeiro-back
docker compose up -d
yarn install
# configure .env com DATABASE_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY
npx prisma migrate dev
yarn prisma:seed
yarn dev
```

## Subir o frontend

```bash
cd ../financeiro-front
cp .env.example .env.local
yarn install
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `API_URL` | URL base da API Nest (apenas servidor). Padrão: `http://localhost:3333` |

## Escopo do MVP

- Login / cadastro / logout
- Resumo do mês (saldo + parcelas)
- Listagem, criação (manual ou recorrência), detalhe e exclusão de dívidas
- Parcelas do mês com ação de pagar
- Extrato com lançamentos (entrada/saída/pagamento)
- Entradas e pagamentos recorrentes
- Categorias e orçamento mensal por categoria
- Relatórios (gastos por categoria/mês e evolução)

## Segurança

- Tokens ficam só em cookies `httpOnly` + `SameSite=Lax` (+ `Secure` em produção)
- O browser não chama o Nest diretamente; as mutações passam pelo proxy Next
- Middleware redireciona rotas privadas sem sessão para `/login`
