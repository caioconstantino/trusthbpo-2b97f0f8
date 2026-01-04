-- Add columns for partial payments tracking
ALTER TABLE public.tb_contas_pagar 
ADD COLUMN IF NOT EXISTS valor_pago numeric DEFAULT 0;

ALTER TABLE public.tb_contas_receber 
ADD COLUMN IF NOT EXISTS valor_recebido numeric DEFAULT 0;

-- Add status "parcial" for partial payments
COMMENT ON COLUMN public.tb_contas_pagar.valor_pago IS 'Total amount paid so far';
COMMENT ON COLUMN public.tb_contas_receber.valor_recebido IS 'Total amount received so far';