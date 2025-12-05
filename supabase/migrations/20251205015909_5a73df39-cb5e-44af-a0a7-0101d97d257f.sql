-- Adicionar campos em tb_alunos para suportar login e empresa
ALTER TABLE public.tb_alunos 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dominio character varying,
ADD COLUMN IF NOT EXISTS senha_temp character varying;

-- Adicionar campo em tb_clientes_saas para identificar contas de alunos
ALTER TABLE public.tb_clientes_saas 
ADD COLUMN IF NOT EXISTS aluno_id uuid REFERENCES public.tb_alunos(id),
ADD COLUMN IF NOT EXISTS tipo_conta character varying DEFAULT 'padrao';

-- Criar índice para busca por aluno_id
CREATE INDEX IF NOT EXISTS idx_clientes_saas_aluno_id ON public.tb_clientes_saas(aluno_id);

-- Criar índice para busca por auth_user_id em alunos
CREATE INDEX IF NOT EXISTS idx_alunos_auth_user_id ON public.tb_alunos(auth_user_id);

-- Atualizar RLS para permitir alunos lerem seus próprios dados
CREATE POLICY "Alunos can view their own data" 
ON public.tb_alunos 
FOR SELECT 
USING (auth_user_id = auth.uid());

-- Permitir alunos atualizarem seus próprios dados
CREATE POLICY "Alunos can update their own data" 
ON public.tb_alunos 
FOR UPDATE 
USING (auth_user_id = auth.uid());