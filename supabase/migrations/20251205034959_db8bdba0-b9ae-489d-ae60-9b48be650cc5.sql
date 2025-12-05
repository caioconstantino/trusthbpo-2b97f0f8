-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage revendas" ON public.tb_revendas;

-- Create separate policies for admins
CREATE POLICY "Admins can view revendas" 
ON public.tb_revendas 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert revendas" 
ON public.tb_revendas 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update revendas" 
ON public.tb_revendas 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete revendas" 
ON public.tb_revendas 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Revenda can view their own data
CREATE POLICY "Revendas can view own data" 
ON public.tb_revendas 
FOR SELECT 
USING (auth_user_id = auth.uid());

-- Create table for reseller product pricing (overprice)
CREATE TABLE public.tb_revendas_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id uuid REFERENCES public.tb_revendas(id) ON DELETE CASCADE NOT NULL,
  produto_codigo varchar NOT NULL, -- 'basico' or 'pro'
  produto_nome varchar NOT NULL,
  preco_original numeric NOT NULL DEFAULT 0,
  preco_revenda numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(revenda_id, produto_codigo)
);

-- Enable RLS
ALTER TABLE public.tb_revendas_produtos ENABLE ROW LEVEL SECURITY;

-- Policies for revendas_produtos
CREATE POLICY "Admins can manage revendas_produtos" 
ON public.tb_revendas_produtos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Revendas can view own produtos" 
ON public.tb_revendas_produtos 
FOR SELECT 
USING (
  revenda_id IN (
    SELECT id FROM public.tb_revendas WHERE auth_user_id = auth.uid()
  )
);

-- Create table for reseller sales/orders
CREATE TABLE public.tb_revendas_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id uuid REFERENCES public.tb_revendas(id) ON DELETE CASCADE NOT NULL,
  cliente_nome varchar NOT NULL,
  cliente_email varchar,
  cliente_dominio varchar,
  produto_codigo varchar NOT NULL,
  produto_nome varchar NOT NULL,
  valor_original numeric NOT NULL DEFAULT 0,
  valor_venda numeric NOT NULL DEFAULT 0,
  lucro numeric NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'pendente',
  data_pagamento timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_revendas_vendas ENABLE ROW LEVEL SECURITY;

-- Policies for revendas_vendas
CREATE POLICY "Admins can manage revendas_vendas" 
ON public.tb_revendas_vendas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Revendas can view own vendas" 
ON public.tb_revendas_vendas 
FOR SELECT 
USING (
  revenda_id IN (
    SELECT id FROM public.tb_revendas WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Revendas can insert own vendas" 
ON public.tb_revendas_vendas 
FOR INSERT 
WITH CHECK (
  revenda_id IN (
    SELECT id FROM public.tb_revendas WHERE auth_user_id = auth.uid()
  )
);

-- Add slug column for reseller landing page
ALTER TABLE public.tb_revendas ADD COLUMN IF NOT EXISTS slug varchar UNIQUE;

-- Update trigger for updated_at
CREATE OR REPLACE TRIGGER update_revendas_produtos_updated_at
BEFORE UPDATE ON public.tb_revendas_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_revendas_vendas_updated_at
BEFORE UPDATE ON public.tb_revendas_vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();