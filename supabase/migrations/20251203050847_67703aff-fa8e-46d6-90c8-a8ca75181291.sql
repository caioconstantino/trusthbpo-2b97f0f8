-- Remove wrong unique index on dominio (should allow multiple clients per domain)
DROP INDEX IF EXISTS public.idx_tb_clientes_dominio;