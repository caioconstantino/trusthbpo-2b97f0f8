-- Adicionar campos faltantes na tabela tb_clientes
ALTER TABLE public.tb_clientes
ADD COLUMN IF NOT EXISTS multiempresa VARCHAR(3) DEFAULT 'Não',
ADD COLUMN IF NOT EXISTS plano VARCHAR(50),
ADD COLUMN IF NOT EXISTS cupom VARCHAR(50),
ADD COLUMN IF NOT EXISTS proximo_pagamento DATE,
ADD COLUMN IF NOT EXISTS ultimo_pagamento DATE,
ADD COLUMN IF NOT EXISTS ultima_forma_pagamento VARCHAR(50);

-- Criar índice único no domínio para melhorar performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_clientes_dominio ON public.tb_clientes(dominio);

-- Criar tabela de usuários por domínio
CREATE TABLE IF NOT EXISTS public.tb_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dominio VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(email, dominio)
);

-- Criar índice para melhorar performance nas consultas por domínio
CREATE INDEX IF NOT EXISTS idx_tb_usuarios_dominio ON public.tb_usuarios(dominio);
CREATE INDEX IF NOT EXISTS idx_tb_usuarios_auth_user_id ON public.tb_usuarios(auth_user_id);

-- Enable RLS
ALTER TABLE public.tb_usuarios ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas do próprio domínio
CREATE POLICY "Usuários podem ver usuários do mesmo domínio"
ON public.tb_usuarios
FOR SELECT
TO authenticated
USING (
  dominio IN (
    SELECT dominio FROM public.tb_usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Policy para inserção durante cadastro
CREATE POLICY "Permitir inserção durante cadastro"
ON public.tb_usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tb_usuarios_updated_at
BEFORE UPDATE ON public.tb_usuarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar domínio (sem usar DEFINER pois não precisa de privilégios especiais)
CREATE OR REPLACE FUNCTION public.validar_dominio(p_dominio VARCHAR)
RETURNS TABLE(existe BOOLEAN, nome_cliente VARCHAR, status VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.tb_clientes WHERE dominio = p_dominio AND status = 'Ativo') as existe,
    razao_social as nome_cliente,
    tb_clientes.status
  FROM public.tb_clientes
  WHERE dominio = p_dominio
  LIMIT 1;
END;
$$;