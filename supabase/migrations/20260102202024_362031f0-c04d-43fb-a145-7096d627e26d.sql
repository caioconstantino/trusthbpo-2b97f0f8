-- Add blind closing configuration column to tb_clientes_saas
ALTER TABLE public.tb_clientes_saas
ADD COLUMN fechamento_cego boolean NOT NULL DEFAULT false;