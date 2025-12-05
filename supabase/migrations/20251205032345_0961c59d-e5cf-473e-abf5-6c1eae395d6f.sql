-- Permitir que usuários autenticados atualizem last_login_at do seu domínio
CREATE POLICY "Users can update last_login_at for their domain" 
ON public.tb_clientes_saas 
FOR UPDATE 
USING (
  dominio IN (
    SELECT dominio FROM public.tb_usuarios WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  dominio IN (
    SELECT dominio FROM public.tb_usuarios WHERE auth_user_id = auth.uid()
  )
);