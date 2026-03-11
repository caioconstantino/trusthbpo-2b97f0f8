

# Hub de Integrações - Plano de Implementação

## Visão Geral

Criar uma nova aba "Integrações" na página de Configurações, com duas seções:
1. **Integrações prontas** (catálogo de conectores pré-configurados como e-commerce, WhatsApp, etc.)
2. **Integrações customizadas** (o usuário cria webhooks para receber dados externos, como vendas de outro sistema)

## Estrutura do Banco de Dados

### Tabela `tb_integracoes` (integrações configuradas pelo usuário)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | ID |
| dominio | varchar | Domínio do cliente |
| unidade_id | integer | Unidade |
| nome | varchar | Nome da integração |
| tipo | varchar | "ecommerce", "erp", "webhook_personalizado", etc. |
| descricao | text | Descrição |
| webhook_token | uuid | Token de autenticação gerado |
| ativo | boolean | Ativa/inativa |
| config | jsonb | Configurações específicas (ex: campos mapeados) |
| created_at / updated_at | timestamptz | Timestamps |

### Tabela `tb_integracoes_logs` (log de chamadas recebidas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | ID |
| integracao_id | uuid FK | Referência à integração |
| status | varchar | "sucesso", "erro" |
| payload | jsonb | Body recebido |
| resposta | text | Mensagem de retorno |
| created_at | timestamptz | Timestamp |

RLS: acesso restrito por domínio via `tb_usuarios`.

## Edge Function: `integration-webhook`

Endpoint público (`verify_jwt = false`) que:
1. Recebe `POST /integration-webhook` com header `X-Integration-Token`
2. Valida o token contra `tb_integracoes`
3. Conforme o `tipo`, processa o payload (ex: tipo "vendas" insere em `tb_vendas` e `tb_vendas_itens`)
4. Registra log em `tb_integracoes_logs`

## UI na Página de Configurações

### Nova aba "Integrações" com ícone `Plug`

**Seção 1 - Integrações Prontas** (cards com logo/ícone):
- E-commerce (receber vendas)
- ERP (sincronizar produtos)
- WhatsApp (notificações)
- Cada card tem botão "Conectar" que abre dialog de configuração

**Seção 2 - Minhas Integrações** (lista/tabela):
- Botão "Nova Integração" abre dialog para:
  - Nome, tipo (dropdown: Receber Vendas, Receber Produtos, Webhook Genérico)
  - Ao criar, gera token + exibe endpoint
- Cada integração mostra: nome, tipo, status (ativo/inativo), token (copiável), endpoint, botão ver logs
- Dialog de logs mostra últimas chamadas com status e payload

## Arquivos Modificados/Criados

1. **Migration SQL** - Criar `tb_integracoes` e `tb_integracoes_logs` com RLS
2. **`supabase/functions/integration-webhook/index.ts`** - Edge function para receber webhooks
3. **`src/pages/Configuracoes.tsx`** - Adicionar aba "Integrações" com TabsTrigger + TabsContent
4. **`supabase/config.toml`** - Registrar nova function com `verify_jwt = false`

