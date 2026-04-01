

## Plan: Integração de Estoque Sincronizado com Site

### O que será construído

Um novo tipo de integração **"sincronizar_estoque"** que mantém o estoque do Trusth e do site externo sempre em sincronia, com:

1. **Carga inicial de estoque** — botão que envia todo o estoque atual para o site via webhook
2. **Trusth → Site** — quando uma venda ou compra altera estoque no Trusth, notifica o site automaticamente
3. **Site → Trusth** — quando o site envia uma venda via webhook, o estoque no Trusth é atualizado

### Como funciona

```text
┌──────────┐    webhook POST     ┌──────────┐
│   Site    │ ──────────────────► │  Trusth  │  (venda do site → baixa estoque)
│ externo  │ ◄────────────────── │          │  (venda/compra Trusth → notifica site)
└──────────┘   callback URL      └──────────┘
```

O site configura uma **URL de callback** na integração. Sempre que o estoque mudar no Trusth, ele faz POST para essa URL com `{ produto_codigo, quantidade_atual }`.

---

### Detalhes Técnicos

**1. Novo tipo de integração no Hub**
- Adicionar `sincronizar_estoque` em `TIPOS_INTEGRACAO` e `INTEGRACOES_PRONTAS` no `IntegrationHubTab.tsx`
- Campo extra `config.callback_url` — URL do site para receber atualizações de estoque
- Botão "Carga Inicial" visível para integrações deste tipo

**2. Edge Function `sync-stock-out` (nova)**
- Recebe `{ dominio, unidade_id, produtos: [{ codigo, quantidade }] }` 
- Busca a integração ativa tipo `sincronizar_estoque` para o domínio
- Faz POST para o `callback_url` configurado com o payload de estoque
- Loga em `tb_integracoes_logs`

**3. Edge Function `integration-webhook` (modificar)**
- Novo handler para `tipo === "sincronizar_estoque"`: recebe vendas do site, baixa estoque no Trusth, e retorna estoque atualizado
- Payload esperado do site: `{ itens: [{ cod_interno, quantidade }] }` (mesmo formato de vendas simplificado)

**4. Notificação automática Trusth → Site**
- No `useSales.ts`: após salvar venda, chamar `sync-stock-out` com os produtos vendidos
- No `CompletePurchaseDialog.tsx`: após concluir compra (estoque sobe), chamar `sync-stock-out`
- Chamadas são fire-and-forget (não bloqueiam a operação principal)

**5. Carga inicial**
- Botão no `IntegrationHubTab` que busca todos os produtos + estoque do domínio/unidade e envia tudo via `sync-stock-out`

**Arquivos a criar:**
- `supabase/functions/sync-stock-out/index.ts`

**Arquivos a modificar:**
- `src/components/IntegrationHubTab.tsx` — novo tipo, campo callback_url, botão carga inicial
- `supabase/functions/integration-webhook/index.ts` — handler `sincronizar_estoque`
- `src/hooks/useSales.ts` — notificar após venda
- `src/components/CompletePurchaseDialog.tsx` — notificar após compra concluída

**Sem alterações no banco de dados** — usa tabelas e campos existentes (`tb_integracoes.config` para `callback_url`).

