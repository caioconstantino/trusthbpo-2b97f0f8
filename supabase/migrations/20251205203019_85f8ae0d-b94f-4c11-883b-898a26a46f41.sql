-- Tabela para produtos da esteira de ofertas especiais
CREATE TABLE public.tb_ofertas_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  funcionalidades TEXT[] DEFAULT '{}',
  desconto_percentual NUMERIC NOT NULL DEFAULT 0,
  link VARCHAR,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_ofertas_produtos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Admins podem gerenciar
CREATE POLICY "Admins can manage ofertas_produtos"
ON public.tb_ofertas_produtos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Todos autenticados podem visualizar ofertas ativas
CREATE POLICY "Authenticated users can view active ofertas"
ON public.tb_ofertas_produtos
FOR SELECT
USING (ativo = true);

-- Trigger para updated_at
CREATE TRIGGER update_ofertas_produtos_updated_at
  BEFORE UPDATE ON public.tb_ofertas_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para imagens das ofertas
INSERT INTO storage.buckets (id, name, public) VALUES ('ofertas', 'ofertas', true);

-- Políticas de storage para o bucket ofertas
CREATE POLICY "Anyone can view ofertas images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ofertas');

CREATE POLICY "Admins can upload ofertas images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ofertas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ofertas images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ofertas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ofertas images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ofertas' AND has_role(auth.uid(), 'admin'::app_role));