-- Increase varchar limits on tb_clientes
ALTER TABLE public.tb_clientes ALTER COLUMN razao_social TYPE VARCHAR(255);
ALTER TABLE public.tb_clientes ALTER COLUMN responsavel TYPE VARCHAR(255);
ALTER TABLE public.tb_clientes ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE public.tb_clientes ALTER COLUMN telefone TYPE VARCHAR(50);
ALTER TABLE public.tb_clientes ALTER COLUMN cpf_cnpj TYPE VARCHAR(20);
ALTER TABLE public.tb_clientes ALTER COLUMN status TYPE VARCHAR(50);
ALTER TABLE public.tb_clientes ALTER COLUMN plano TYPE VARCHAR(100);
ALTER TABLE public.tb_clientes ALTER COLUMN cupom TYPE VARCHAR(100);
ALTER TABLE public.tb_clientes ALTER COLUMN ultima_forma_pagamento TYPE VARCHAR(100);