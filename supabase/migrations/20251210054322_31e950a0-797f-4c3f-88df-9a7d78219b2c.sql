-- Create table for cash withdrawals (sangrias)
CREATE TABLE public.tb_sangrias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sessao_id UUID NOT NULL REFERENCES public.tb_sessoes_caixa(id) ON DELETE CASCADE,
  dominio VARCHAR NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  valor NUMERIC NOT NULL DEFAULT 0,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_sangrias ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Permitir leitura para autenticados" 
ON public.tb_sangrias 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção para autenticados" 
ON public.tb_sangrias 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" 
ON public.tb_sangrias 
FOR UPDATE 
USING (true);