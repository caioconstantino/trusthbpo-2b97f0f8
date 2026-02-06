-- Tabela para colunas customizadas do Kanban de propostas
CREATE TABLE public.tb_propostas_kanban_colunas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio TEXT NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6b7280',
  ordem INTEGER NOT NULL DEFAULT 0,
  status_proposta TEXT, -- mapeia para um status de proposta (opcional)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para automações de propostas
CREATE TABLE public.tb_propostas_automacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio TEXT NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  coluna_origem_id UUID REFERENCES public.tb_propostas_kanban_colunas(id) ON DELETE CASCADE,
  coluna_destino_id UUID REFERENCES public.tb_propostas_kanban_colunas(id) ON DELETE CASCADE,
  tipo_acao TEXT NOT NULL, -- 'email_cliente', 'lembrete', 'notificacao', 'webhook'
  config JSONB DEFAULT '{}', -- configurações específicas da ação
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna_id na tabela de propostas para mapear ao kanban
ALTER TABLE public.tb_propostas ADD COLUMN coluna_id UUID REFERENCES public.tb_propostas_kanban_colunas(id);

-- Tabela para lembretes/tarefas
CREATE TABLE public.tb_propostas_lembretes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES public.tb_propostas(id) ON DELETE CASCADE,
  dominio TEXT NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_lembrete TIMESTAMP WITH TIME ZONE NOT NULL,
  concluido BOOLEAN DEFAULT false,
  automacao_id UUID REFERENCES public.tb_propostas_automacoes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para notificações internas
CREATE TABLE public.tb_propostas_notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES public.tb_propostas(id) ON DELETE CASCADE,
  dominio TEXT NOT NULL,
  unidade_id INTEGER REFERENCES public.tb_unidades(id),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  automacao_id UUID REFERENCES public.tb_propostas_automacoes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_propostas_kanban_colunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_propostas_automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_propostas_lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_propostas_notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies para colunas
CREATE POLICY "Users can view their domain columns"
  ON public.tb_propostas_kanban_colunas FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their domain columns"
  ON public.tb_propostas_kanban_colunas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their domain columns"
  ON public.tb_propostas_kanban_colunas FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their domain columns"
  ON public.tb_propostas_kanban_colunas FOR DELETE
  USING (true);

-- Policies para automações
CREATE POLICY "Users can view their domain automations"
  ON public.tb_propostas_automacoes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their domain automations"
  ON public.tb_propostas_automacoes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their domain automations"
  ON public.tb_propostas_automacoes FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their domain automations"
  ON public.tb_propostas_automacoes FOR DELETE
  USING (true);

-- Policies para lembretes
CREATE POLICY "Users can view their domain reminders"
  ON public.tb_propostas_lembretes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their domain reminders"
  ON public.tb_propostas_lembretes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their domain reminders"
  ON public.tb_propostas_lembretes FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their domain reminders"
  ON public.tb_propostas_lembretes FOR DELETE
  USING (true);

-- Policies para notificações
CREATE POLICY "Users can view their domain notifications"
  ON public.tb_propostas_notificacoes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their domain notifications"
  ON public.tb_propostas_notificacoes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their domain notifications"
  ON public.tb_propostas_notificacoes FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their domain notifications"
  ON public.tb_propostas_notificacoes FOR DELETE
  USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_propostas_kanban_colunas_updated_at
  BEFORE UPDATE ON public.tb_propostas_kanban_colunas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_propostas_automacoes_updated_at
  BEFORE UPDATE ON public.tb_propostas_automacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_propostas_lembretes_updated_at
  BEFORE UPDATE ON public.tb_propostas_lembretes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();