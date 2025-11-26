-- Ajustar políticas da tb_usuarios para permitir verificação durante login
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo domínio" ON public.tb_usuarios;
DROP POLICY IF EXISTS "Permitir inserção durante cadastro" ON public.tb_usuarios;

-- Permitir leitura pública para validação de login
CREATE POLICY "Permitir leitura para validação de login"
ON public.tb_usuarios
FOR SELECT
USING (true);

-- Permitir inserção apenas para usuários autenticados
CREATE POLICY "Permitir inserção para autenticados"
ON public.tb_usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Permitir atualização apenas do próprio registro
CREATE POLICY "Permitir atualização do próprio perfil"
ON public.tb_usuarios
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid());