## Plano: Integração "Enviar Produtos para Site"

Nova integração que envia o cadastro de produtos do Trusth para um site externo (POST `/sync-products`), com carga inicial e sincronização automática quando produtos são criados/editados/excluídos.

### Como funciona

```text
┌──────────┐  POST /sync-products  ┌──────────┐
│  Trusth  │ ───────────────────►  │   Site   │
│          │  payload {produtos}   │ externo  │
└──────────┘                       └──────────┘
```

A integração armazena:
- `endpoint_url` — URL completa do `/sync-products` do site
- `apikey` — chave do header `apikey`

Sempre que um produto é criado, atualizado ou excluído no Trusth, dispara um POST para o endpoint do site, no formato ERP documentado.

---

### 1. Novo tipo de integração no Hub

Em `IntegrationHubTab.tsx`:

- Adicionar `enviar_produtos` em `TIPOS_INTEGRACAO` (icon Package, label "Enviar Produtos para Site")
- Adicionar card em `INTEGRACOES_PRONTAS`: "Catálogo do Site" — descricao "Envie e mantenha seu catálogo de produtos sincronizado com seu site"
- No diálogo de criar/editar, quando `tipo === "enviar_produtos"`:
  - Campo **URL do endpoint** (`config.endpoint_url`) — ex: `https://qkwypgohprykzhuhqmwr.supabase.co/functions/v1/sync-products`
  - Campo **API Key** (`config.apikey`) — armazenado em `tb_integracoes.config`
- Botão **"Carga Inicial"** para integrações deste tipo: lê todos os produtos do domínio/unidade e envia em lote via nova edge function `sync-products-out`

### 2. Nova Edge Function `sync-products-out`

`supabase/functions/sync-products-out/index.ts` (verify_jwt = false, registrada em `config.toml`)

Entrada:
```json
{
  "dominio": "...",
  "unidade_id": 1,
  "produtos": [{ id, codigo, nome, ... }],   // opcional - se omitido, busca todos
  "action": "upsert" | "delete",
  "integracao_id": "..."  // opcional - se omitido, busca todas ativas tipo enviar_produtos
}
```

Lógica:
1. Busca integrações ativas tipo `enviar_produtos` para o domínio (filtrando por `integracao_id` se passado)
2. Para cada integração, monta payload no formato ERP:
   ```json
   { "produtos": [
     { "codigo", "nome", "preco", "preco_compra", "estoque",
       "categoria", "imagem", "codigo_barras" }
   ] }
   ```
   Para `action: "delete"`: `{ "codigo": "...", "action": "delete" }`
3. Faz `POST` para `config.endpoint_url` com headers `apikey` e `Content-Type`
4. Loga em `tb_integracoes_logs` (status sucesso/erro + resposta)
5. Suporta produtos em lote (envia tudo num único POST por integração)

Para obter o estoque, faz join com `tb_estq_unidades` pela `unidade_id` da integração; categoria via `tb_categorias`.

### 3. Disparo automático nos hooks de produtos

Adicionar chamadas fire-and-forget para `sync-products-out`:

- **`src/components/ProductForm.tsx`** — após criar produto (upsert)
- **`src/components/EditProductSheet.tsx`** — após salvar edição (upsert)
- **`src/components/ProductsTable.tsx`** — após excluir produto (delete, envia só o `codigo`)
- **`src/components/ImportProdutosDialog.tsx`** — após importação XLSX (upsert em lote)

Helper utilitário `src/lib/syncProductsToSite.ts` para evitar duplicação:
```ts
export async function syncProductsToSite(dominio, unidadeId, produtos, action = "upsert") {
  // chama sync-products-out fire-and-forget
}
```

### 4. Botão "Carga Inicial" no Hub

No `IntegrationHubTab.tsx`, função `handleCargaInicialProdutos(integracao)`:
- Busca todos os produtos ativos do domínio/unidade
- Chama `sync-products-out` com a lista completa, `action: "upsert"`, `integracao_id` específico
- Mostra toast com total enviado

### 5. Arquivos

**Criar:**
- `supabase/functions/sync-products-out/index.ts`
- `src/lib/syncProductsToSite.ts`

**Modificar:**
- `supabase/config.toml` — registrar `[functions.sync-products-out] verify_jwt = false`
- `src/components/IntegrationHubTab.tsx` — novo tipo, campos endpoint/apikey, botão carga inicial
- `src/components/ProductForm.tsx` — chamar sync após criar
- `src/components/EditProductSheet.tsx` — chamar sync após editar
- `src/components/ProductsTable.tsx` — chamar sync após excluir
- `src/components/ImportProdutosDialog.tsx` — chamar sync após importar

**Sem alterações no banco** — usa `tb_integracoes.config` (jsonb) para guardar `endpoint_url` e `apikey`.

### Observações de segurança

- `apikey` fica em `tb_integracoes.config` protegido por RLS (apenas usuários do domínio veem)
- Envios são fire-and-forget no client, com logging server-side em `tb_integracoes_logs` para auditoria/debug
