# PDV Autoatendimento (Totem)

## Objetivo
Tela de totem touch onde o cliente monta o próprio carrinho, informa CPF e finaliza pagamento via PIX (QR dinâmico Pagar.me) ou Cartão (maquininha externa, modo confiança). Sem senha de retirada — fluxo "mercadinho".

## Fluxo do cliente
1. **Tela inicial (atrair)** — logo da unidade, "Toque para começar".
2. **Catálogo** — grid de produtos com:
   - Abas/chips de categorias (vindas de `tb_produtos_categorias`)
   - Campo invisível focado para leitor de código de barras (entrada por teclado HID → busca por `codigo` e adiciona ao carrinho automaticamente)
   - Busca por nome
   - Cards grandes com imagem, nome, preço, botão "+"
3. **Carrinho lateral/inferior** — itens, ajuste de qtd, remover, total.
4. **CPF** — modal numérico touch (apenas dígitos, opcional "Não informar").
5. **Pagamento**:
   - **PIX**: gera cobrança via Pagar.me, exibe QR Code, faz polling até confirmação (webhook atualiza status).
   - **Cartão (maquininha)**: tela "Passe o cartão na maquininha", operador/cliente confirma manualmente → registra venda como paga (confiança).
6. **Sucesso** — "Pagamento confirmado, retire seus produtos" → volta ao início após 5s.

## Telas / Rotas
- `/totem/:dominio/:unidadeId` — rota pública (sem login) que abre fullscreen e roda em loop.
- Reaproveita `tb_produtos`, `tb_estq_unidades`, `tb_produtos_categorias`, `tb_vendas`, `tb_vendas_itens`, `tb_vendas_pagamentos`.
- Cria registros no PDV vinculados a uma **sessão de caixa especial do totem** (auto-aberta por unidade, tipo `totem`) para não exigir operador logado.

## Backend (Edge Functions)
- `totem-catalogo` (público) — retorna produtos+categorias+estoque da unidade.
- `totem-criar-pix` — cria pedido Pagar.me com `payment_method: pix`, retorna `qr_code` e `transaction_id`.
- `totem-status-pagamento` — consulta status (usado para polling como fallback do webhook).
- `pagarme-webhook` — estende para `order.paid` em vendas do totem → marca venda como `pago` e libera tela de sucesso (canal Realtime).
- `totem-finalizar-venda` — registra venda, itens, pagamento, baixa estoque (reutiliza lógica do `useSales`).

## Banco
Migração nova:
- `tb_totens` (id, dominio, unidade_id, nome, ativo, slug público, sessao_caixa_id padrão)
- `tb_vendas`: adicionar coluna `origem` ('pdv' | 'totem') e `cpf_cliente`
- `tb_vendas_pagamentos`: já tem forma_pagamento, adicionar `transaction_id_externo` e `status` ('pendente' | 'pago')
- RLS: leitura pública apenas via Edge Function (Service Role); inserts de venda apenas via Edge Function.

## Configuração (admin)
Nova aba em `/configuracoes` → **Totem**:
- Ativar/desativar totem por unidade
- Gerar link público `/totem/:slug`
- Selecionar quais categorias aparecem (opcional, default: todas)
- Habilitar pagamento em cartão "modo confiança"

## Hardware
- Leitor de código de barras USB padrão (HID) — funciona como teclado, captura via input invisível auto-focado.
- Touchscreen — UI com botões mínimos 56px, fontes grandes, contraste alto.

## Etapas de implementação
1. Migração: `tb_totens`, colunas em `tb_vendas`/`tb_vendas_pagamentos`.
2. Edge Functions: `totem-catalogo`, `totem-criar-pix`, `totem-status-pagamento`, `totem-finalizar-venda` + extensão do `pagarme-webhook`.
3. Página `/totem/:slug` com fluxo completo (atrair → catálogo → carrinho → CPF → pagamento → sucesso).
4. Aba "Totem" em Configurações para gerar slug e ativar.
5. Teste de ponta a ponta: scan de código, PIX sandbox, confirmação via webhook.

## Fora do escopo (futuro)
- Impressora de cupom térmico
- TEF integrado (Stone/Cielo/Pagar.me Tap)
- Senha de retirada / fila de produção (cozinha)
