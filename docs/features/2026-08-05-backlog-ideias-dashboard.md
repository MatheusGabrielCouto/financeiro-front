# Backlog de ideias — Dashboard

- **Status:** ideia
- **Área:** outro (várias)
- **Prioridade:** média
- **Data:** 2026-08-05
- **Autor:** produto / engineering

## Problema

A dashboard já cobre o dia a dia (extrato, dívidas, previstos, pra pagar, insights, caixinhas), mas ainda faltam fluxos que reduzam atrito, aumentem previsibilidade e fechem o ciclo “planejei → paguei → entendi”.

## Proposta

Lista priorizada de ideias para o **financeiro-front**, alinhadas ao que já existe. Cada item pode virar um plano próprio (`docs/features/YYYY-MM-DD-slug.md`) quando for entrar em execução.

## Já existe (não reinventar)

Início, extrato, relatórios, insights, notificações, dívidas, a pagar do mês, planejador, simulador, planilha, pra pagar, gastos previstos, caixinhas, contas/receitas fixas, orçamento, categorias, área interna de crons.

---

## Ideias (por prioridade sugerida)

### 1. Inbox unificada de lembretes (alta) — feito

**Problema:** notificações são calculadas; pra pagar, previstos e parcelas vivem em telas separadas.  
**Proposta:** uma visão “O que precisa da sua atenção” no início / `/notificacoes`, agrupando: atrasados, previstos, pra pagar OPEN, fluxo apertado, metas de caixinha.  
**Escopo dashboard:** leitura + deep links; marcar feito em pra pagar sem inventar inbox no banco.  
**API:** reutilizar `/details`, `/payment-reminder`, `/planned-expense`, due-alerts existentes.  
**Implementação:** `/notificacoes` como inbox (vencimentos + pra pagar + insights); badge inclui OPEN reminders; card no início aponta para a inbox.

---

### 2. Assentos rápidos no extrato (alta) — feito

**Problema:** lançar saída/entrada no desktop ainda é mais lento que no app.  
**Proposta:** atalho flutuante ou barra “+ Entrada / + Saída” no extrato e no início, com categorias recentes e valor.  
**Escopo:** só web; reutilizar `POST` de transactions.  
**Extra:** templates (“mercado”, “combustível”, “farmácia”).  
**Implementação:** modal `QuickTransactionLauncher` no início (hero) e extrato (toolbar + FAB mobile).

---

### 3. Metas mensais de categoria com alerta visual (alta) — feito

**Problema:** orçamento existe, mas o feedback “estou estouando?” é fraco no dia a dia.  
**Proposta:** no início e no orçamento, barra por categoria (gasto do mês / limite) + aviso quando passar de 80%.  
**API:** `/budget` + categorias do `/details` ou reports.  
**Implementação:** card `BudgetSpotlight` no início; helpers compartilhados em `budget-status`; `/orcamento` reutilizado com status 80%/100%.

---

### 4. Comparativo mês atual vs mês passado (média) — feito

**Problema:** relatórios mostram tendências, mas falta um “como estou vs mês passado” em uma tela.  
**Proposta:** card no início / relatórios: receita, saídas, sobra, top 3 categorias — delta % vs mês anterior.  
**API:** dois `GET /details` ou evolution já existente.  
**Implementação:** `MonthCompareCard` + helpers em `month-compare`; início e `/relatorios` com dois `getDetails`.

---

### 5. Exportar relatório (PDF / CSV) (média) — feito (CSV)

**Problema:** compartilhar ou arquivar o mês fora do app é manual.  
**Proposta:** botão em `/relatorios` e `/extrato` — CSV do extrato; PDF resumido (receitas, gastos, por categoria, sobra).  
**Escopo v1:** CSV no client; PDF gerado no client ou endpoint simples no back.  
**Implementação:** `ExportCsvButton` + `lib/csv` (BOM UTF-8); extrato e relatório mensal. PDF fica para depois.

---

### 6. Conciliar “Pra pagar” ↔ extrato automaticamente (média) — feito

**Problema:** usuário paga fora e esquece de marcar o lembrete / lançar.  
**Proposta:** ao criar lançamento no extrato, sugerir “bate com algum item de Pra pagar?” por valor/título similar.  
**API:** match leve no front ou endpoint de sugestão no back.  
**Implementação:** após DEBIT/PAY, sugestão via `matchPaymentReminders` + modal; aceitar chama só `/done` (sem novo débito).

---

### 7. Calendário mensal de vencimentos (média) — feito

**Problema:** parcelas, contas fixas e previstos são listas; falta visão de calendário.  
**Proposta:** `/calendario` com dias do mês e pontos (atrasado / hoje / semana). Clique abre o item.  
**API:** mesma base de `/parcelas` + previstos.  
**Implementação:** grid mensal + painel do dia; `buildPayableItems` compartilhado; nav em Dívidas.

---

### 8. Regras de categorização (média)

**Problema:** muitos lançamentos caem em “Outros” / sem categoria.  
**Proposta:** regras “se a mensagem contém X → categoria Y”; aplicar ao criar e em lote no extrato.  
**API:** modelo novo `CategoryRule` + endpoint; opcional no app depois.

---

### 9. Multi-conta / bancos na dashboard (baixa → média)

**Problema:** saldo é único; usuário mistura conta corrente, cartão e dinheiro.  
**Proposta:** contas manuais (nome, saldo inicial) e lançamentos vinculados; início mostra consolidado + por conta.  
**Não inclui v1:** Open Finance / sync automático.

---

### 10. Modo “fechamento do mês” (baixa) — feito

**Problema:** fim do mês não tem ritual claro.  
**Proposta:** wizard em 5 passos: revisar atrasados → marcar pra pagar → confirmar previstos → olhar sobra → exportar resumo.  
**Reutiliza** telas existentes com checklist.  
**Implementação:** `/fechamento` + `FechamentoWizard`; ações via proxy; CSV do resumo.

---

### 11. Compartilhar / família light (baixa)

**Problema:** casal quer ver o mesmo orçamento sem duas contas separadas.  
**Proposta:** convite read-only ou “conta conjunta” web (já há joint account no back — expor na dashboard).  
**API:** aproveitar módulo de joint account se maduro.

---

### 12. Tema claro/escuro e atalhos de teclado (baixa) — feito

**Problema:** uso intenso no desktop.  
**Proposta:** preferência de tema; atalhos (`N` novo lançamento, `/` busca no extrato).  
**Só front.**  
**Implementação:** `html.dark` + tokens CSS; toggle no header/perfil; `N` abre lançamento; `/` foca busca do extrato.

---

## Ordem sugerida de ataque

1. Assentos rápidos no extrato  
2. Inbox unificada no início/notificações  
3. Barras de orçamento por categoria  
4. Comparativo mês a mês  
5. Export CSV  
6. Calendário de vencimentos  
7. Demais itens conforme demanda

## Critérios para promover uma ideia a plano

- [ ] Problema claro e recorrente  
- [ ] Cabe em 1–3 PRs  
- [ ] API existente cobre 70%+ ou escopo back está claro  
- [ ] Não duplica tela já existente  
- [ ] Critérios de pronto escritos

## Notas

- Prioridades são sugestão de produto; ajustáveis.  
- Features que exigem migration ou novo domínio (regras, multi-conta) devem ter plano próprio antes de código.  
- App mobile fica fora deste backlog, salvo menção explícita.
