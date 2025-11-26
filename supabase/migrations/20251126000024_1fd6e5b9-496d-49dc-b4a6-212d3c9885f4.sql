-- Habilitar RLS em todas as tabelas públicas
ALTER TABLE public.tb_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_categorias_contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_estq_unidades ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para tb_clientes (somente leitura para autenticados)
CREATE POLICY "Permitir leitura para autenticados"
ON public.tb_clientes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção para autenticados"
ON public.tb_clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados"
ON public.tb_clientes
FOR UPDATE
TO authenticated
USING (true);

-- Políticas para tb_categorias
CREATE POLICY "Permitir leitura para autenticados"
ON public.tb_categorias
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção para autenticados"
ON public.tb_categorias
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas para tb_categorias_contas_pagar
CREATE POLICY "Permitir leitura para autenticados"
ON public.tb_categorias_contas_pagar
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção para autenticados"
ON public.tb_categorias_contas_pagar
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas para tb_escolas
CREATE POLICY "Permitir leitura para autenticados"
ON public.tb_escolas
FOR SELECT
TO authenticated
USING (true);

-- Políticas para tb_estq_unidades
CREATE POLICY "Permitir leitura para autenticados"
ON public.tb_estq_unidades
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção para autenticados"
ON public.tb_estq_unidades
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Corrigir search_path nas funções existentes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_dominio(p_dominio VARCHAR)
RETURNS TABLE(existe BOOLEAN, nome_cliente VARCHAR, status VARCHAR)
LANGUAGE plpgsql
SET search_path = public
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