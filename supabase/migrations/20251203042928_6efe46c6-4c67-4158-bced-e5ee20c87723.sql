-- Create table for purchases
CREATE TABLE public.tb_compras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  fornecedor VARCHAR,
  unidade VARCHAR DEFAULT 'Matriz',
  status VARCHAR NOT NULL DEFAULT 'pendente',
  total NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for purchase items
CREATE TABLE public.tb_compras_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id UUID NOT NULL REFERENCES public.tb_compras(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES public.tb_produtos(id),
  produto_nome VARCHAR NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_custo NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_compras_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tb_compras
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_compras
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_compras
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" ON public.tb_compras
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para autenticados" ON public.tb_compras
  FOR DELETE USING (true);

-- RLS Policies for tb_compras_itens
CREATE POLICY "Permitir leitura para autenticados" ON public.tb_compras_itens
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" ON public.tb_compras_itens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" ON public.tb_compras_itens
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para autenticados" ON public.tb_compras_itens
  FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_compras_updated_at
  BEFORE UPDATE ON public.tb_compras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();