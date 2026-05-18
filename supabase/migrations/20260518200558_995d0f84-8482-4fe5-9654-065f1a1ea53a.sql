
-- Tabela de configuração dos totens
CREATE TABLE IF NOT EXISTS public.tb_totens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio character varying NOT NULL,
  unidade_id integer,
  nome character varying NOT NULL DEFAULT 'Totem',
  slug character varying NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  cartao_confianca boolean NOT NULL DEFAULT true,
  pix_ativo boolean NOT NULL DEFAULT true,
  categorias_visiveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  cor_primaria text DEFAULT '#2563eb',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tb_totens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read totem by slug if active"
ON public.tb_totens FOR SELECT
USING (ativo = true);

CREATE POLICY "Users manage totens of their domain"
ON public.tb_totens FOR ALL
USING ((dominio)::text IN (SELECT tb_usuarios.dominio FROM public.tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()))
WITH CHECK ((dominio)::text IN (SELECT tb_usuarios.dominio FROM public.tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()));

CREATE TRIGGER trg_tb_totens_updated_at
BEFORE UPDATE ON public.tb_totens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar colunas para identificar origem da venda
ALTER TABLE public.tb_vendas
  ADD COLUMN IF NOT EXISTS origem character varying NOT NULL DEFAULT 'pdv',
  ADD COLUMN IF NOT EXISTS cpf_cliente character varying,
  ADD COLUMN IF NOT EXISTS totem_id uuid REFERENCES public.tb_totens(id);

-- Adicionar status e id externo em pagamentos
ALTER TABLE public.tb_vendas_pagamentos
  ADD COLUMN IF NOT EXISTS status character varying NOT NULL DEFAULT 'pago',
  ADD COLUMN IF NOT EXISTS transaction_id_externo character varying,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS qr_code_url text;

CREATE INDEX IF NOT EXISTS idx_tb_totens_slug ON public.tb_totens(slug);
CREATE INDEX IF NOT EXISTS idx_tb_vendas_totem ON public.tb_vendas(totem_id);
