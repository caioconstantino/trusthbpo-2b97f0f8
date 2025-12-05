-- Adicionar coluna para usuários adicionais
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN usuarios_adicionais integer NOT NULL DEFAULT 0;