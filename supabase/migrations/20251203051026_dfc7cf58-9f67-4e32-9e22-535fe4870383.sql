-- Create categories table for contas a receber
CREATE TABLE public.tb_categorias_contas_receber (
  id SERIAL PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  nome VARCHAR(100),
  parent_id INTEGER,
  edit CHAR(1) NOT NULL DEFAULT 'N',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_categorias_contas_receber ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Permitir leitura para autenticados" 
ON public.tb_categorias_contas_receber FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para autenticados" 
ON public.tb_categorias_contas_receber FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados" 
ON public.tb_categorias_contas_receber FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para autenticados" 
ON public.tb_categorias_contas_receber FOR DELETE USING (true);