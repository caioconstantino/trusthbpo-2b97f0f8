-- Adicionar campo last_login_at em tb_clientes_saas
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;