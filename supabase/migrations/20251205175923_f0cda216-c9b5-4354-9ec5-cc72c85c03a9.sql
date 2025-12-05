-- Adicionar campos para rastrear adicionais contratados
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN IF NOT EXISTS pdvs_adicionais integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS empresas_adicionais integer NOT NULL DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.tb_clientes_saas.pdvs_adicionais IS 'Quantidade de PDVs adicionais contratados (R$ 10,00/mês cada)';
COMMENT ON COLUMN public.tb_clientes_saas.empresas_adicionais IS 'Quantidade de empresas adicionais contratadas (R$ 10,00/mês cada)';