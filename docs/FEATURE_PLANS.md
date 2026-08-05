# Planos de features — Dashboard

Registro de ideias e planos para novas features do **financeiro-front** (dashboard web).

## Como usar

1. Crie um arquivo em `docs/features/` com o nome `YYYY-MM-DD-slug-curto.md`  
   Ex.: `docs/features/2026-08-05-exportar-pdf-relatorios.md`
2. Copie o template abaixo.
3. Mantenha status atualizado: `ideia` → `planejado` → `em progresso` → `feito` / `descartado`.
4. Quando implementar, linke o plano no PR/commit e mova o status para `feito`.

---

## Índice

| Feature | Status | Arquivo |
|---------|--------|---------|
| Backlog de ideias — Dashboard | ideia | [features/2026-08-05-backlog-ideias-dashboard.md](features/2026-08-05-backlog-ideias-dashboard.md) |

---

## Template

```md
# Título da feature

- **Status:** ideia | planejado | em progresso | feito | descartado
- **Área:** início | extrato | dívidas | planejamento | relatórios | insights | notificações | auth | outro
- **Prioridade:** baixa | média | alta
- **Data:** YYYY-MM-DD
- **Autor:**

## Problema

O que dói hoje / o que o usuário não consegue fazer.

## Proposta

Resumo em 2–4 frases do que vamos entregar na dashboard.

## Escopo

### Inclui
- …

### Não inclui
- … (ex.: app mobile nesta entrega)

## UX / telas

- Rotas novas ou alteradas:
- Fluxo principal:
- Empty / loading / erro:

## API / dados

- Endpoints existentes a reutilizar:
- Endpoints novos (se precisar no back):
- Campos / modelos:

## Critérios de pronto

- [ ] …
- [ ] …
- [ ] Testado em desktop e mobile web

## Notas / riscos

…
```

---

## Convenções

- Foque no **dashboard** (`financeiro-front`). Se a feature depender do back ou do app, marque no escopo.
- Prefira planos curtos e acionáveis; detalhes de implementação ficam no PR.
- Não coloque secrets, tokens ou dados reais de usuários neste diretório.
