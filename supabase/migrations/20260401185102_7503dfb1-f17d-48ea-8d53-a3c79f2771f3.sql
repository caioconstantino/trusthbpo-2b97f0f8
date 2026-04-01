CREATE POLICY "Permitir atualização para autenticados" ON public.tb_estq_unidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para autenticados" ON public.tb_estq_unidades FOR DELETE TO authenticated USING (true);