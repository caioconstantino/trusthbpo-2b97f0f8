-- Add unidade_id to tables that need company filtering
ALTER TABLE public.tb_produtos ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_clientes ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_vendas ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_compras ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_contas_pagar ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_contas_receber ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_sessoes_caixa ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_categorias ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_categorias_contas_pagar ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);
ALTER TABLE public.tb_categorias_contas_receber ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES tb_unidades(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_produtos_unidade ON tb_produtos(unidade_id);
CREATE INDEX IF NOT EXISTS idx_clientes_unidade ON tb_clientes(unidade_id);
CREATE INDEX IF NOT EXISTS idx_vendas_unidade ON tb_vendas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_compras_unidade ON tb_compras(unidade_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_unidade ON tb_contas_pagar(unidade_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_unidade ON tb_contas_receber(unidade_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_caixa_unidade ON tb_sessoes_caixa(unidade_id);