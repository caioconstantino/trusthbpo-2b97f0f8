ALTER TABLE public.tb_clientes_saas
ADD COLUMN IF NOT EXISTS catalogo_redirect_url TEXT,
ADD COLUMN IF NOT EXISTS catalogo_redirect_ativo BOOLEAN NOT NULL DEFAULT false;