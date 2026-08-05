# Projeção anual na dashboard

- **Status:** planejado
- **Área:** início | relatórios
- **Prioridade:** alta
- **Data:** 2026-08-05
- **Autor:** produto / engineering
- **Roadmap:** [2026-08-05-roadmap-ambicioso-dashboard.md](./2026-08-05-roadmap-ambicioso-dashboard.md) · Fase 0.3

## Problema

O usuário vê bem o mês corrente, mas não enxerga o ano: meses apertados por parcelas, sazonalidade de gasto variável e sobra acumulada. O back já expõe `GET /details/projection`, e a web não consome.

## Proposta

Expor a projeção anual do ano selecionado no **início** (card resumo) e em **`/relatorios`** (visão completa com gráfico mensal), reutilizando o endpoint existente sem inventar modelo novo.

## Escopo

### Inclui
- Client `getAnnualProjection(year)` em `lib/finance-api`
- Tipos TS alinhados ao payload do back
- Card no início: totais do ano (receitas / compromissos / variável estimado / sobra) + link “Ver ano”
- Seção em `/relatorios` (ou `/relatorios?view=ano`) com barras por mês e seletor de ano
- Empty state quando não houver recorrências/parcelas

### Não inclui
- Previsão 90 dias (fase 2.3 — endpoint agregado diferente)
- Edição de projeções
- Cartões de crédito na projeção (hoje o back exclui `cardId` nas parcelas; gap documentado)
- App mobile

## UX / telas

- **Rotas:** `/` (card), `/relatorios` (bloco anual; opcional query `year`)
- **Fluxo:** usuário escolhe ano → vê 12 meses + totais → pode comparar com relatório mensal já existente
- **Empty / loading / erro:** skeleton no card; mensagem se ano sem dados; erro 401 logout

## API / dados

- **Reutilizar:** `GET /details/projection?year=`
- **Endpoints novos:** nenhum na v1
- **Campos:** consumir o JSON já retornado (mensal + agregados — validar shape no consumo e tipar em `lib/types`)
- **Gap conhecido:** parcelas de cartão (`cardId != null`) ficam de fora; tratar na feature de cartões ou follow-up no back

## Critérios de pronto

- [ ] Projeção carrega no início e em relatórios para o ano corrente
- [ ] Troca de ano atualiza totais e gráfico
- [ ] Tipos TS sem `any`; erros de API tratados
- [ ] Não quebra layout mobile web
- [ ] Testado em desktop e mobile web

## Notas / riscos

- Entrega rápida (API pronta) — boa “vitória” para abrir o ciclo do roadmap.
- Confirmar com o payload real se a média de variável passada é clara na UI (rótulos “estimado” vs “lançado”).
- Se o gráfico poluir `/relatorios`, preferir aba/âncora “Ano” em vez de empilhar tudo no scroll.

## Estimativa

- **Esforço:** ~1–2 PRs front  
- **Dependência back:** nenhuma
