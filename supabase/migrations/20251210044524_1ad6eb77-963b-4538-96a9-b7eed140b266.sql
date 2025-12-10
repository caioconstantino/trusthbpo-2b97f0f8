-- Tabela de configuração de agenda por unidade
CREATE TABLE public.tb_agenda_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio character varying NOT NULL,
  unidade_id integer REFERENCES public.tb_unidades(id),
  tipo character varying NOT NULL DEFAULT 'servicos', -- 'servicos' ou 'eventos'
  nome character varying NOT NULL DEFAULT 'Minha Agenda',
  slug character varying NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  horario_inicio time NOT NULL DEFAULT '08:00',
  horario_fim time NOT NULL DEFAULT '18:00',
  intervalo_minutos integer NOT NULL DEFAULT 30,
  dias_funcionamento integer[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Dom, 1=Seg, etc
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

-- Tabela de serviços habilitados para agenda
CREATE TABLE public.tb_agenda_servicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_config_id uuid NOT NULL REFERENCES public.tb_agenda_config(id) ON DELETE CASCADE,
  produto_id integer NOT NULL REFERENCES public.tb_produtos(id) ON DELETE CASCADE,
  duracao_minutos integer NOT NULL DEFAULT 60,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agenda_config_id, produto_id)
);

-- Tabela de agendamentos
CREATE TABLE public.tb_agendamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio character varying NOT NULL,
  unidade_id integer REFERENCES public.tb_unidades(id),
  agenda_config_id uuid NOT NULL REFERENCES public.tb_agenda_config(id) ON DELETE CASCADE,
  tipo character varying NOT NULL DEFAULT 'servico', -- 'servico' ou 'evento'
  titulo character varying NOT NULL,
  descricao text,
  cliente_nome character varying,
  cliente_telefone character varying,
  cliente_email character varying,
  produto_id integer REFERENCES public.tb_produtos(id),
  data_inicio timestamp with time zone NOT NULL,
  data_fim timestamp with time zone NOT NULL,
  status character varying NOT NULL DEFAULT 'agendado', -- 'agendado', 'confirmado', 'cancelado', 'concluido'
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_agenda_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_agenda_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para tb_agenda_config
CREATE POLICY "Users can view their domain agenda config"
ON public.tb_agenda_config FOR SELECT
USING ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Users can insert agenda config for their domain"
ON public.tb_agenda_config FOR INSERT
WITH CHECK ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their domain agenda config"
ON public.tb_agenda_config FOR UPDATE
USING ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Users can delete their domain agenda config"
ON public.tb_agenda_config FOR DELETE
USING ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Public can view active agenda config by slug"
ON public.tb_agenda_config FOR SELECT
USING (ativo = true AND slug IS NOT NULL);

-- Políticas para tb_agenda_servicos
CREATE POLICY "Users can manage agenda servicos via config"
ON public.tb_agenda_servicos FOR ALL
USING (agenda_config_id IN (
  SELECT id FROM tb_agenda_config WHERE dominio IN (
    SELECT dominio FROM tb_usuarios WHERE auth_user_id = auth.uid()
  )
));

CREATE POLICY "Public can view active agenda servicos"
ON public.tb_agenda_servicos FOR SELECT
USING (ativo = true AND agenda_config_id IN (
  SELECT id FROM tb_agenda_config WHERE ativo = true
));

-- Políticas para tb_agendamentos
CREATE POLICY "Users can view their domain agendamentos"
ON public.tb_agendamentos FOR SELECT
USING ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Users can insert agendamentos for their domain"
ON public.tb_agendamentos FOR INSERT
WITH CHECK ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their domain agendamentos"
ON public.tb_agendamentos FOR UPDATE
USING ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Users can delete their domain agendamentos"
ON public.tb_agendamentos FOR DELETE
USING ((dominio)::text IN (
  SELECT tb_usuarios.dominio FROM tb_usuarios WHERE tb_usuarios.auth_user_id = auth.uid()
));

CREATE POLICY "Public can insert agendamentos via public link"
ON public.tb_agendamentos FOR INSERT
WITH CHECK (agenda_config_id IN (
  SELECT id FROM tb_agenda_config WHERE ativo = true
));

-- Adicionar coluna agenda_ativa em tb_clientes_saas
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN IF NOT EXISTS agenda_ativa boolean NOT NULL DEFAULT false;

-- Trigger para updated_at
CREATE TRIGGER update_agenda_config_updated_at
BEFORE UPDATE ON public.tb_agenda_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at
BEFORE UPDATE ON public.tb_agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();