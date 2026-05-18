
-- ============ EMPRESAS ============
CREATE TABLE public.tb_edu_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social varchar NOT NULL,
  cnpj varchar,
  email varchar,
  telefone varchar,
  responsavel varchar,
  endereco text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_edu_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edu admins manage empresas" ON public.tb_edu_empresas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'));

-- ============ CONTRATOS ============
CREATE TABLE public.tb_edu_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.tb_edu_empresas(id) ON DELETE CASCADE,
  numero varchar,
  data_inicio date NOT NULL,
  data_fim date,
  valor_mensal_por_estagiario numeric NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_edu_contratos_empresa ON public.tb_edu_contratos(empresa_id);
ALTER TABLE public.tb_edu_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edu admins manage contratos" ON public.tb_edu_contratos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'));

-- ============ ESTAGIOS ============
CREATE TABLE public.tb_edu_estagios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.tb_alunos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.tb_edu_empresas(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES public.tb_edu_contratos(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date,
  valor_mensal numeric NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_edu_estagios_aluno ON public.tb_edu_estagios(aluno_id);
CREATE INDEX idx_edu_estagios_empresa ON public.tb_edu_estagios(empresa_id);
CREATE INDEX idx_edu_estagios_status ON public.tb_edu_estagios(status);
ALTER TABLE public.tb_edu_estagios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edu admins manage estagios" ON public.tb_edu_estagios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'));

-- ============ FATURAS ============
CREATE TABLE public.tb_edu_faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.tb_edu_empresas(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.tb_edu_contratos(id) ON DELETE SET NULL,
  competencia date NOT NULL,
  qtd_estagiarios integer NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'aberta',
  data_vencimento date,
  data_pagamento date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, competencia)
);
CREATE INDEX idx_edu_faturas_competencia ON public.tb_edu_faturas(competencia);
CREATE INDEX idx_edu_faturas_status ON public.tb_edu_faturas(status);
ALTER TABLE public.tb_edu_faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edu admins manage faturas" ON public.tb_edu_faturas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_educacao'));

-- Updated_at triggers
CREATE TRIGGER edu_empresas_updated_at BEFORE UPDATE ON public.tb_edu_empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER edu_contratos_updated_at BEFORE UPDATE ON public.tb_edu_contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER edu_estagios_updated_at BEFORE UPDATE ON public.tb_edu_estagios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER edu_faturas_updated_at BEFORE UPDATE ON public.tb_edu_faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
