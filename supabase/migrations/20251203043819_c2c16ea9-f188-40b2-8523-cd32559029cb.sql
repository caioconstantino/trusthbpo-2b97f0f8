-- Add UPDATE and DELETE policies to tb_categorias_contas_pagar
CREATE POLICY "Permitir atualização para autenticados" 
ON public.tb_categorias_contas_pagar 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão para autenticados" 
ON public.tb_categorias_contas_pagar 
FOR DELETE 
USING (true);