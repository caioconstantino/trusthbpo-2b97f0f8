-- Create table for POS sessions
CREATE TABLE public.tb_sessoes_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  usuario_id UUID NOT NULL,
  usuario_nome VARCHAR NOT NULL,
  caixa_nome VARCHAR NOT NULL DEFAULT 'Caixa 1',
  valor_abertura NUMERIC NOT NULL DEFAULT 0,
  valor_fechamento NUMERIC,
  status VARCHAR NOT NULL DEFAULT 'aberto',
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sales linked to sessions
CREATE TABLE public.tb_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  sessao_id UUID REFERENCES public.tb_sessoes_caixa(id),
  cliente_nome VARCHAR,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  desconto_percentual NUMERIC NOT NULL DEFAULT 0,
  acrescimo_percentual NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  troco NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sale items
CREATE TABLE public.tb_vendas_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.tb_vendas(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL,
  produto_nome VARCHAR NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sale payments
CREATE TABLE public.tb_vendas_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.tb_vendas(id) ON DELETE CASCADE,
  forma_pagamento VARCHAR NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_sessoes_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_vendas_pagamentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tb_sessoes_caixa
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_sessoes_caixa
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_sessoes_caixa
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" ON public.tb_sessoes_caixa
  FOR UPDATE USING (true);

-- RLS Policies for tb_vendas
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_vendas
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_vendas
  FOR INSERT WITH CHECK (true);

-- RLS Policies for tb_vendas_itens
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_vendas_itens
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_vendas_itens
  FOR INSERT WITH CHECK (true);

-- RLS Policies for tb_vendas_pagamentos
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_vendas_pagamentos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_vendas_pagamentos
  FOR INSERT WITH CHECK (true);

-- Add trigger for updated_at on sessoes_caixa
CREATE TRIGGER update_sessoes_caixa_updated_at
  BEFORE UPDATE ON public.tb_sessoes_caixa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();