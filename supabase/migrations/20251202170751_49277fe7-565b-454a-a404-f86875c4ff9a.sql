-- Criar tabela de produtos
CREATE TABLE public.tb_produtos (
  id SERIAL PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  codigo VARCHAR,
  nome VARCHAR NOT NULL,
  tipo VARCHAR DEFAULT 'padrao',
  categoria_id INTEGER REFERENCES public.tb_categorias(id),
  preco_custo DECIMAL(10,2) DEFAULT 0,
  preco_venda DECIMAL(10,2) DEFAULT 0,
  codigo_barras VARCHAR,
  observacao TEXT,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tb_produtos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura para autenticados"
ON public.tb_produtos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção para autenticados"
ON public.tb_produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados"
ON public.tb_produtos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Permitir exclusão para autenticados"
ON public.tb_produtos
FOR DELETE
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_tb_produtos_updated_at
BEFORE UPDATE ON public.tb_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public) VALUES ('produtos', 'produtos', true);

-- Políticas de storage para imagens
CREATE POLICY "Imagens de produtos públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'produtos');

CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'produtos');

CREATE POLICY "Usuários autenticados podem atualizar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'produtos');

CREATE POLICY "Usuários autenticados podem deletar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'produtos');

-- Adicionar políticas UPDATE/DELETE na tb_categorias
CREATE POLICY "Permitir atualização para autenticados"
ON public.tb_categorias
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Permitir exclusão para autenticados"
ON public.tb_categorias
FOR DELETE
TO authenticated
USING (true);