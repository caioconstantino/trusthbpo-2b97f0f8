-- Add DELETE policy for tb_usuarios to allow users to delete other users in their domain
CREATE POLICY "Permitir exclusão de usuários do mesmo domínio"
ON public.tb_usuarios
FOR DELETE
USING (
  dominio = (
    SELECT dominio FROM public.tb_usuarios WHERE auth_user_id = auth.uid() LIMIT 1
  )
);