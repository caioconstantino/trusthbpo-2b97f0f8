-- Adicionar campo valor_pago para armazenar o valor que o cliente pagou
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN IF NOT EXISTS valor_pago numeric(10,2);

-- Comentário para documentação
COMMENT ON COLUMN public.tb_clientes_saas.valor_pago IS 'Valor pago pelo cliente (em R$). Usado para rastrear valores de revenda que podem diferir dos valores padrão dos planos.';

