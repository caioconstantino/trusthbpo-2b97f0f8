-- Criar tabela de revendas
CREATE TABLE public.tb_revendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  documento VARCHAR,
  telefone VARCHAR,
  auth_user_id UUID,
  status VARCHAR NOT NULL DEFAULT 'Ativo',
  comissao_percentual NUMERIC NOT NULL DEFAULT 10,
  saldo NUMERIC NOT NULL DEFAULT 0,
  total_ganho NUMERIC NOT NULL DEFAULT 0,
  total_sacado NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tb_revendas ENABLE ROW LEVEL SECURITY;

-- Policies para admin
CREATE POLICY "Admins can manage revendas" 
ON public.tb_revendas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tb_revendas_updated_at
BEFORE UPDATE ON public.tb_revendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();