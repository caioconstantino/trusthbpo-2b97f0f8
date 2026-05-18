CREATE TABLE public.tb_edu_processos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  contrato_id UUID,
  qtd_vagas INTEGER NOT NULL DEFAULT 1,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  coluna VARCHAR NOT NULL DEFAULT 'solicitacao',
  ordem INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tb_edu_processos_candidatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.tb_edu_processos(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'candidato',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tb_edu_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_edu_processos_candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edu admins manage processos" ON public.tb_edu_processos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'admin_educacao'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'admin_educacao'));

CREATE POLICY "Edu admins manage processos candidatos" ON public.tb_edu_processos_candidatos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'admin_educacao'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'admin_educacao'));

CREATE TRIGGER trg_edu_processos_updated
  BEFORE UPDATE ON public.tb_edu_processos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();