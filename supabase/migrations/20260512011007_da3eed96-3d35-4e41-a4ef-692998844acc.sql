
-- 1. Helper: get current user's domain (security definer to avoid recursion on tb_usuarios policies)
CREATE OR REPLACE FUNCTION public.get_my_dominio()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dominio::text FROM public.tb_usuarios WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- 2. tb_usuarios: restrict SELECT to authenticated users in same domain (or own row)
DROP POLICY IF EXISTS "Permitir leitura para validação de login" ON public.tb_usuarios;

CREATE POLICY "Users can view profiles in their domain"
ON public.tb_usuarios
FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR dominio::text = public.get_my_dominio()
);

-- 3. tb_vendas: scope by domain
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON public.tb_vendas;
DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON public.tb_vendas;

CREATE POLICY "Users can view sales in their domain"
ON public.tb_vendas FOR SELECT TO authenticated
USING (dominio::text = public.get_my_dominio());

CREATE POLICY "Users can insert sales in their domain"
ON public.tb_vendas FOR INSERT TO authenticated
WITH CHECK (dominio::text = public.get_my_dominio());

CREATE POLICY "Users can update sales in their domain"
ON public.tb_vendas FOR UPDATE TO authenticated
USING (dominio::text = public.get_my_dominio())
WITH CHECK (dominio::text = public.get_my_dominio());

CREATE POLICY "Users can delete sales in their domain"
ON public.tb_vendas FOR DELETE TO authenticated
USING (dominio::text = public.get_my_dominio());

-- 4. tb_vendas_itens: scope through parent tb_vendas
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON public.tb_vendas_itens;
DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON public.tb_vendas_itens;

CREATE POLICY "Users can view sale items in their domain"
ON public.tb_vendas_itens FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

CREATE POLICY "Users can insert sale items in their domain"
ON public.tb_vendas_itens FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

CREATE POLICY "Users can update sale items in their domain"
ON public.tb_vendas_itens FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

CREATE POLICY "Users can delete sale items in their domain"
ON public.tb_vendas_itens FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

-- 5. tb_vendas_pagamentos: scope through parent tb_vendas
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON public.tb_vendas_pagamentos;
DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON public.tb_vendas_pagamentos;

CREATE POLICY "Users can view sale payments in their domain"
ON public.tb_vendas_pagamentos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

CREATE POLICY "Users can insert sale payments in their domain"
ON public.tb_vendas_pagamentos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

CREATE POLICY "Users can update sale payments in their domain"
ON public.tb_vendas_pagamentos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

CREATE POLICY "Users can delete sale payments in their domain"
ON public.tb_vendas_pagamentos FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tb_vendas v WHERE v.id = venda_id AND v.dominio::text = public.get_my_dominio()));

-- 6. Pin search_path on existing function lacking it
CREATE OR REPLACE FUNCTION public.get_next_proposta_numero(p_dominio text, p_unidade_id integer)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO next_num
  FROM public.tb_propostas
  WHERE dominio = p_dominio AND (unidade_id = p_unidade_id OR (unidade_id IS NULL AND p_unidade_id IS NULL));
  RETURN next_num;
END;
$function$;
