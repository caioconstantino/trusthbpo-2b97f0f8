-- Create table for SaaS customers (the companies that subscribe to the platform)
CREATE TABLE public.tb_clientes_saas (
    id SERIAL PRIMARY KEY,
    dominio VARCHAR NOT NULL UNIQUE,
    razao_social VARCHAR NOT NULL,
    cpf_cnpj VARCHAR,
    email VARCHAR,
    telefone VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'Lead',
    responsavel VARCHAR,
    plano VARCHAR,
    cupom VARCHAR,
    multiempresa VARCHAR DEFAULT 'Não',
    proximo_pagamento DATE,
    ultimo_pagamento DATE,
    ultima_forma_pagamento VARCHAR,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_clientes_saas ENABLE ROW LEVEL SECURITY;

-- Only admins can manage SaaS customers
CREATE POLICY "Admins can view all SaaS customers"
ON public.tb_clientes_saas
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert SaaS customers"
ON public.tb_clientes_saas
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update SaaS customers"
ON public.tb_clientes_saas
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete SaaS customers"
ON public.tb_clientes_saas
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_tb_clientes_saas_updated_at
BEFORE UPDATE ON public.tb_clientes_saas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();