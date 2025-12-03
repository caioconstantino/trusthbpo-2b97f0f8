-- Create tb_contas_receber table
CREATE TABLE public.tb_contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  categoria VARCHAR,
  descricao VARCHAR NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  vencimento DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  forma_pagamento VARCHAR,
  cliente VARCHAR,
  venda_id UUID,
  data_recebimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_contas_receber ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Permitir leitura para autenticados" 
ON public.tb_contas_receber 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção para autenticados" 
ON public.tb_contas_receber 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" 
ON public.tb_contas_receber 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão para autenticados" 
ON public.tb_contas_receber 
FOR DELETE 
USING (true);