
-- Create integrations table
CREATE TABLE public.tb_integracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio varchar NOT NULL,
  unidade_id integer REFERENCES public.tb_unidades(id),
  nome varchar NOT NULL,
  tipo varchar NOT NULL DEFAULT 'webhook_personalizado',
  descricao text,
  webhook_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ativo boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create integration logs table
CREATE TABLE public.tb_integracoes_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id uuid NOT NULL REFERENCES public.tb_integracoes(id) ON DELETE CASCADE,
  status varchar NOT NULL DEFAULT 'sucesso',
  payload jsonb,
  resposta text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_integracoes_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for tb_integracoes (domain-based via tb_usuarios)
CREATE POLICY "Users can view their domain integrations"
  ON public.tb_integracoes FOR SELECT TO authenticated
  USING (dominio IN (SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert integrations for their domain"
  ON public.tb_integracoes FOR INSERT TO authenticated
  WITH CHECK (dominio IN (SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their domain integrations"
  ON public.tb_integracoes FOR UPDATE TO authenticated
  USING (dominio IN (SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their domain integrations"
  ON public.tb_integracoes FOR DELETE TO authenticated
  USING (dominio IN (SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()));

-- RLS policies for tb_integracoes_logs (via integracao join)
CREATE POLICY "Users can view their domain integration logs"
  ON public.tb_integracoes_logs FOR SELECT TO authenticated
  USING (integracao_id IN (
    SELECT id FROM tb_integracoes WHERE dominio IN (
      SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete their domain integration logs"
  ON public.tb_integracoes_logs FOR DELETE TO authenticated
  USING (integracao_id IN (
    SELECT id FROM tb_integracoes WHERE dominio IN (
      SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
    )
  ));

-- Allow service role / edge functions to insert logs (public insert for webhook)
CREATE POLICY "Service can insert integration logs"
  ON public.tb_integracoes_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_tb_integracoes_updated_at
  BEFORE UPDATE ON public.tb_integracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
