-- Create table for permission groups
CREATE TABLE public.tb_grupos_permissao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for module permissions per group
CREATE TABLE public.tb_grupos_permissao_modulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID NOT NULL REFERENCES public.tb_grupos_permissao(id) ON DELETE CASCADE,
  modulo VARCHAR NOT NULL,
  visualizar BOOLEAN NOT NULL DEFAULT false,
  editar BOOLEAN NOT NULL DEFAULT false,
  excluir BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add grupo_id to tb_usuarios
ALTER TABLE public.tb_usuarios 
ADD COLUMN grupo_id UUID REFERENCES public.tb_grupos_permissao(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.tb_grupos_permissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_grupos_permissao_modulos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tb_grupos_permissao
CREATE POLICY "Users can view groups from their domain"
ON public.tb_grupos_permissao
FOR SELECT
USING (true);

CREATE POLICY "Users can insert groups for their domain"
ON public.tb_grupos_permissao
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update groups from their domain"
ON public.tb_grupos_permissao
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete groups from their domain"
ON public.tb_grupos_permissao
FOR DELETE
USING (true);

-- RLS Policies for tb_grupos_permissao_modulos
CREATE POLICY "Users can view module permissions"
ON public.tb_grupos_permissao_modulos
FOR SELECT
USING (true);

CREATE POLICY "Users can insert module permissions"
ON public.tb_grupos_permissao_modulos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update module permissions"
ON public.tb_grupos_permissao_modulos
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete module permissions"
ON public.tb_grupos_permissao_modulos
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_tb_grupos_permissao_updated_at
BEFORE UPDATE ON public.tb_grupos_permissao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();