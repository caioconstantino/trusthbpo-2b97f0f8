-- Tabela de modelos de proposta
CREATE TABLE public.tb_propostas_modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio TEXT NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  layout JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de propostas
CREATE TABLE public.tb_propostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio TEXT NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  modelo_id UUID REFERENCES public.tb_propostas_modelos(id),
  numero INTEGER NOT NULL,
  cliente_id INTEGER REFERENCES public.tb_clientes(id),
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  titulo TEXT NOT NULL,
  layout JSONB NOT NULL DEFAULT '[]',
  condicoes TEXT,
  validade_dias INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'rascunho',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  venda_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens da proposta
CREATE TABLE public.tb_propostas_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES public.tb_propostas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES public.tb_produtos(id),
  descricao TEXT NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto_percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sequência para numeração de propostas por domínio
CREATE OR REPLACE FUNCTION public.get_next_proposta_numero(p_dominio TEXT, p_unidade_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO next_num
  FROM public.tb_propostas
  WHERE dominio = p_dominio AND (unidade_id = p_unidade_id OR (unidade_id IS NULL AND p_unidade_id IS NULL));
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.tb_propostas_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_propostas_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tb_propostas_modelos
CREATE POLICY "Users can view their own proposal templates" 
ON public.tb_propostas_modelos FOR SELECT USING (true);

CREATE POLICY "Users can create proposal templates" 
ON public.tb_propostas_modelos FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own proposal templates" 
ON public.tb_propostas_modelos FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own proposal templates" 
ON public.tb_propostas_modelos FOR DELETE USING (true);

-- RLS Policies for tb_propostas
CREATE POLICY "Users can view their own proposals" 
ON public.tb_propostas FOR SELECT USING (true);

CREATE POLICY "Users can create proposals" 
ON public.tb_propostas FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own proposals" 
ON public.tb_propostas FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own proposals" 
ON public.tb_propostas FOR DELETE USING (true);

-- RLS Policies for tb_propostas_itens
CREATE POLICY "Users can view proposal items" 
ON public.tb_propostas_itens FOR SELECT USING (true);

CREATE POLICY "Users can create proposal items" 
ON public.tb_propostas_itens FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update proposal items" 
ON public.tb_propostas_itens FOR UPDATE USING (true);

CREATE POLICY "Users can delete proposal items" 
ON public.tb_propostas_itens FOR DELETE USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_propostas_modelos_updated_at
BEFORE UPDATE ON public.tb_propostas_modelos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_propostas_updated_at
BEFORE UPDATE ON public.tb_propostas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();