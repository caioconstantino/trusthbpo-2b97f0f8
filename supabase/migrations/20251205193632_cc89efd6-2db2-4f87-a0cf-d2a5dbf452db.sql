-- Add produtos_adicionais field to tb_clientes_saas for tracking product limit extensions
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN IF NOT EXISTS produtos_adicionais integer NOT NULL DEFAULT 0;