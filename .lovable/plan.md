# Painel Admin — Educação

Painel separado para gestão da operação educacional (alunos, empresas contratantes, contratos, estágios ativos e faturamento).

## Acesso

- Nova role `admin_educacao` na tabela `user_roles` (enum `app_role`).
- Login dedicado em `/admin/educacao/login`.
- Rota protegida `EducacaoAdminProtectedRoute` (mesma lógica do `AdminProtectedRoute`, validando a role `admin_educacao` OU `admin`).
- Layout próprio com sidebar dourada para diferenciar do `/admin` comercial.

## Páginas

```
/admin/educacao/login         → Login
/admin/educacao               → Dashboard (KPIs)
/admin/educacao/alunos        → Lista de alunos (reaproveita query de tb_alunos)
/admin/educacao/empresas      → CRUD de empresas contratantes
/admin/educacao/contratos     → CRUD de contratos (empresa + valor mensal + vigência)
/admin/educacao/estagios      → Estagiários ativos (aluno + empresa + contrato)
/admin/educacao/faturamento   → Faturas mensais geradas por estágio ativo
```

## Banco de dados

Novas tabelas:

- **tb_edu_empresas** — empresas que contratam estagiários
  - razao_social, cnpj, email, telefone, responsavel, endereco, observacoes, ativo
- **tb_edu_contratos** — contrato entre empresa e a operação
  - empresa_id, numero, data_inicio, data_fim, valor_mensal_por_estagiario, status ('ativo','encerrado','suspenso'), observacoes
- **tb_edu_estagios** — vínculo aluno × empresa × contrato
  - aluno_id (→ tb_alunos), empresa_id, contrato_id, data_inicio, data_fim, valor_mensal, status ('ativo','encerrado','suspenso')
- **tb_edu_faturas** — faturamento mensal
  - empresa_id, contrato_id, competencia (YYYY-MM-01), valor_total, qtd_estagiarios, status ('aberta','paga','vencida'), data_vencimento, data_pagamento

RLS: somente quem tem `has_role(auth.uid(),'admin')` OU `has_role(auth.uid(),'admin_educacao')` pode acessar.

## Dashboard (KPIs)

- Total de alunos cadastrados
- Estágios ativos no momento
- Empresas contratantes ativas
- MRR de estágios (soma de `valor_mensal` dos estágios ativos)
- Faturado no mês corrente / em aberto

## Faturamento

- Botão "Gerar faturas do mês" na página `/admin/educacao/faturamento`.
- Para cada empresa com estagiários ativos na competência, cria uma `tb_edu_faturas` agregando valor × quantidade.
- Idempotente por (empresa_id, competencia).

## Detalhes técnicos

- Reusa componentes UI shadcn existentes (Card, Table, Dialog, Badge).
- Cores: paleta dourada (#D4AF37 / #E0C158) para destacar área educacional, alinhado ao botão "Quero estagiar" já criado.
- `EducacaoAdminLayout` com sidebar simples (sem dependência de unidade/dominio — é dado global da operação).
- Migration única criando enum value, tabelas, policies e índices.
- Botão na sidebar de `/admin` (existente) com link para `/admin/educacao` aparece apenas para admins gerais (atalho cross-painel).
