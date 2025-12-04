-- Create table for storing referral codes/links
CREATE TABLE public.tb_indicacoes_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio varchar NOT NULL,
  codigo varchar NOT NULL UNIQUE,
  link_slug varchar NOT NULL UNIQUE,
  saldo numeric NOT NULL DEFAULT 0,
  total_ganho numeric NOT NULL DEFAULT 0,
  total_sacado numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for referral history
CREATE TABLE public.tb_indicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_dominio varchar NOT NULL,
  indicado_dominio varchar NOT NULL,
  indicado_nome varchar NOT NULL,
  indicado_email varchar,
  valor_assinatura numeric NOT NULL DEFAULT 0,
  percentual_comissao numeric NOT NULL DEFAULT 10,
  valor_comissao numeric NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'pendente',
  data_conversao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for withdrawal requests
CREATE TABLE public.tb_saques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio varchar NOT NULL,
  valor numeric NOT NULL,
  status varchar NOT NULL DEFAULT 'pendente',
  chave_pix varchar,
  tipo_chave_pix varchar,
  observacoes text,
  data_processamento timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_indicacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_saques ENABLE ROW LEVEL SECURITY;

-- RLS policies for tb_indicacoes_config
CREATE POLICY "Users can view their own referral config"
ON public.tb_indicacoes_config FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own referral config"
ON public.tb_indicacoes_config FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own referral config"
ON public.tb_indicacoes_config FOR UPDATE
USING (true);

-- RLS policies for tb_indicacoes
CREATE POLICY "Users can view their referrals"
ON public.tb_indicacoes FOR SELECT
USING (true);

CREATE POLICY "Users can insert referrals"
ON public.tb_indicacoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update referrals"
ON public.tb_indicacoes FOR UPDATE
USING (true);

-- RLS policies for tb_saques
CREATE POLICY "Users can view their withdrawals"
ON public.tb_saques FOR SELECT
USING (true);

CREATE POLICY "Users can insert withdrawals"
ON public.tb_saques FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update withdrawals"
ON public.tb_saques FOR UPDATE
USING (true);