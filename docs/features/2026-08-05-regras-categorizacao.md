# Regras de categorização

- **Status:** planejado
- **Área:** categorias | extrato
- **Prioridade:** alta
- **Data:** 2026-08-05
- **Autor:** produto / engineering
- **Roadmap:** [2026-08-05-roadmap-ambicioso-dashboard.md](./2026-08-05-roadmap-ambicioso-dashboard.md) · Fase 2.1

## Problema

Muitos lançamentos caem em “Outros” ou sem categoria. O usuário categoriza à mão no extrato e o padrão se repete (“IFOOD”, “UBER”, “MERCADO”), gerando atrito e relatórios fracos.

## Proposta

Permitir **regras explícitas** (“se a mensagem contém X → categoria Y”), aplicadas automaticamente ao criar/editar lançamento e em lote no extrato. v1 sem ML — só match configurável, previsível e auditável.

## Escopo

### Inclui
- Modelo e API de regras no **financeiro-back**
- UI `/categorias/regras` (listar, criar, editar, ordenar prioridade, ativar/desativar, excluir)
- Auto-aplicação em `POST`/`PATCH` de transaction quando categoria vier vazia (ou flag “respeitar regra”)
- Ação no extrato: “Aplicar regras às últimas N / período”
- Sugestão pós-lançamento rápido se alguma regra bateu (toast/linha “categorizado como …”)

### Não inclui
- Machine learning / embeddings
- Regras por valor, dia da semana ou merchant estruturado (pode ser v2)
- Sync especial no app (app passa a se beneficiar via API automaticamente)
- Alterar hierarquia de categorias

## UX / telas

- **Rotas:** `/categorias/regras` (+ link em `/categorias`)
- **Fluxo criar regra:** texto “contém” → escolher categoria → prioridade → salvar → testar com exemplo
- **Fluxo extrato:** botão “Aplicar regras” → resumo “N lançamentos atualizados”
- **Empty:** CTA com 2–3 exemplos (“IFOOD → Alimentação”)
- **Erro:** padrão inválido / categoria inexistente

## API / dados

### Back novo

**Model Prisma `CategoryRule`:**
- `id`, `userId`
- `matchType`: `CONTAINS` | `STARTS_WITH` | `EQUALS` (v1 pode lançar só `CONTAINS`)
- `pattern`: string (normalizar trim + case-insensitive na aplicação)
- `categoryId`
- `priority`: int (menor número = maior prioridade)
- `enabled`: boolean
- `createdAt`, `updatedAt`
- Index `(userId, enabled, priority)`

**Endpoints:**
- `GET /category-rule` — lista do usuário
- `POST /category-rule`
- `PATCH /category-rule/:id`
- `DELETE /category-rule/:id`
- `POST /category-rule/preview` — body `{ message }` → regra vencedora (para UI de teste)
- `POST /category-rule/apply-batch` — body `{ from?, to?, limit?, onlyUncategorized?: true }` → `{ updated, skipped }`

**Hook:**
- Em create/update de transaction: se `categoryId` ausente (ou `applyRules: true`), resolver primeira regra enabled que case na `message`.

### Front

- Wrappers em `finance-api`
- Página de regras + integração extrato / quick launcher

## Critérios de pronto

- [ ] Migration Prisma aplicada
- [ ] CRUD de regras com validação Zod
- [ ] Create de lançamento sem categoria aplica regra automaticamente
- [ ] Batch no extrato atualiza só o que deve (`onlyUncategorized` default true)
- [ ] Prioridade respeitada (duas regras batem → ganha a de menor `priority`)
- [ ] Match case-insensitive; sem regex perigosa na v1
- [ ] UI testada desktop e mobile web
- [ ] App mobile não quebra (campos opcionais / só benefício)

## Notas / riscos

- **Primeira feature de domínio novo do ciclo** — desenhar migration e ownership (`userId`) com cuidado.
- Evitar regex arbitrário do usuário (DoS / surpresas); v1 = substring.
- Conflito com categoria escolhida manualmente: nunca sobrescrever categoria já setada no batch default.
- Joint account: regras são por `userId` dono do lançamento; documentar comportamento se o débito for conjunto.
- Seed opcional de regras sugeridas no onboarding (fase seguinte).

## Estimativa

- **Esforço:** ~1 PR back (model+API+hook) + ~2 PRs front (UI regras + extrato/batch)
- **Dependência:** nenhuma de outras features do roadmap; desbloqueia qualidade de orçamento/relatórios
