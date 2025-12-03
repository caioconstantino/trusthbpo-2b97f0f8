-- Adicionar policy de DELETE para tb_clientes
CREATE POLICY "Permitir exclusão para autenticados" 
ON public.tb_clientes 
FOR DELETE 
TO authenticated 
USING (true);