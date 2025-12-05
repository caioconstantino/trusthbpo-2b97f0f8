-- Allow public read access to active revendas by slug (for landing page)
CREATE POLICY "Public can view active revendas by slug" 
ON public.tb_revendas 
FOR SELECT 
USING (status = 'Ativo' AND slug IS NOT NULL);

-- Allow public read access to revenda products (for landing page pricing)
CREATE POLICY "Public can view revenda produtos" 
ON public.tb_revendas_produtos 
FOR SELECT 
USING (
  revenda_id IN (
    SELECT id FROM public.tb_revendas WHERE status = 'Ativo' AND slug IS NOT NULL
  )
);

-- Allow revendas to insert their own sales
CREATE POLICY "Public can insert revenda vendas" 
ON public.tb_revendas_vendas 
FOR INSERT 
WITH CHECK (true);