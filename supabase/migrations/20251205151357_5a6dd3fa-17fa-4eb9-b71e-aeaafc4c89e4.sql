-- Create table for multi-company (unidades) management
CREATE TABLE public.tb_unidades (
  id SERIAL PRIMARY KEY,
  dominio VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  endereco_logradouro VARCHAR,
  endereco_numero VARCHAR,
  endereco_bairro VARCHAR,
  endereco_cidade VARCHAR,
  endereco_estado VARCHAR,
  endereco_cep VARCHAR,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_unidades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their domain units"
ON public.tb_unidades
FOR SELECT
USING (
  dominio IN (
    SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert units for their domain"
ON public.tb_unidades
FOR INSERT
WITH CHECK (
  dominio IN (
    SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their domain units"
ON public.tb_unidades
FOR UPDATE
USING (
  dominio IN (
    SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their domain units"
ON public.tb_unidades
FOR DELETE
USING (
  dominio IN (
    SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_tb_unidades_updated_at
  BEFORE UPDATE ON public.tb_unidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();