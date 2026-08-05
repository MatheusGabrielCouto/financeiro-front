# Cartões de crédito na dashboard

- **Status:** feito
- **Área:** outro (novo domínio web) | início | a pagar | notificações
- **Prioridade:** alta
- **Data:** 2026-08-05
- **Autor:** produto / engineering
- **Roadmap:** [2026-08-05-roadmap-ambicioso-dashboard.md](./2026-08-05-roadmap-ambicioso-dashboard.md) · Fase 1.1

## Progresso

- [x] Types + `finance-api` wrappers
- [x] `/cartoes`, `/cartoes/novo`, `/cartoes/[id]`
- [x] Nav + page-meta
- [x] Card resumo no início (limite + fatura aberta)
- [x] Inbox “fatura em aberto” (`/notificacoes` + badge)
- [x] Seção em **A pagar este mês** (`/parcelas`)
- [x] Helper compartilhado `lib/credit-card-alerts.ts`
- [ ] Push (deixado local a pedido)

## Problema

Compras no cartão e faturas existem no app/back (`/credit-card`), mas a dashboard ignora esse fluxo. O usuário perde limite, fatura aberta e o impacto no “a pagar” ao usar só o web.

## Proposta

Levar cartões para o web com paridade útil (não 100% feature-complete com o app): listar cartões, ver fatura/extrato do mês, registrar compra parcelada e pagar fatura. Integrar fatura aberta na inbox / a pagar do mês como compromisso de cartão.

## Escopo

### Inclui
- Nav: item **Cartões**
- `/cartoes`, `/cartoes/novo`, `/cartoes/[id]`
- Compra rápida e pagar fatura
- Card no início com limite + fatura
- Inbox + badge + seção em `/parcelas`
- Tipagem + wrappers em `lib/finance-api`

### Não inclui
- Open Finance / sync da operadora
- Endpoint agregado `GET /credit-card/summary` (front agrega com Promise.all)
- Multi-carteira
- Reescrever planejador/dívidas

## Critérios de pronto

- [x] CRUD mínimo de cartão na web (criar, listar, excluir)
- [x] Ver fatura e statement do mês corrente
- [x] Registrar compra (à vista ou parcelada) e refletir na fatura
- [x] Pagar fatura atualiza UI (e saldo conforme regra do back)
- [x] Item de nav + empty/loading/erro
- [x] Inbox e a pagar mostram faturas abertas com deep link
- [x] Contrato compatível com o app (sem breaking change no back)
- [ ] Teste manual smoke no browser (ambiente do usuário)

## Notas / riscos

- Pagar fatura mexe em saldo/`User.amount` — erros do back (saldo insuficiente) aparecem no `ProxyActionButton`.
- Parcelas de cartão ficam fora de `GET /installment` (`cardId: null`) — por isso a seção dedicada.
- Projeção anual ainda ignora cartão — follow-up na feature de projeção.
