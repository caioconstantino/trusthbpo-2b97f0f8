-- Create table for accounts payable
CREATE TABLE public.tb_contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  categoria VARCHAR,
  descricao VARCHAR NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  vencimento DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  forma_pagamento VARCHAR,
  fornecedor VARCHAR,
  compra_id UUID REFERENCES public.tb_compras(id) ON DELETE SET NULL,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_contas_pagar ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_contas_pagar
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_contas_pagar
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" ON public.tb_contas_pagar
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para autenticados" ON public.tb_contas_pagar
  FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_contas_pagar_updated_at
  BEFORE UPDATE ON public.tb_contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();