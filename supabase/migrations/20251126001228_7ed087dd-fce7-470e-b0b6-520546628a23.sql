-- Ajustar política de leitura da tb_clientes para permitir acesso público
-- Isso é necessário para a validação do domínio funcionar sem autenticação
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON public.tb_clientes;

CREATE POLICY "Permitir leitura de domínios públicos"
ON public.tb_clientes
FOR SELECT
USING (true);

-- Manter as outras políticas com autenticação
DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON public.tb_clientes;
DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON public.tb_clientes;

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