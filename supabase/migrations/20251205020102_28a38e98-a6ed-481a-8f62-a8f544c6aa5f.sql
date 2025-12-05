-- Criar função para sincronizar status do aluno com cliente SaaS
CREATE OR REPLACE FUNCTION public.sync_aluno_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando o aluno for desativado, suspender a licença da empresa
  IF NEW.ativo = false AND OLD.ativo = true THEN
    UPDATE public.tb_clientes_saas 
    SET status = 'Suspenso'
    WHERE aluno_id = NEW.id;
  END IF;
  
  -- Quando o aluno for reativado, ativar a licença da empresa
  IF NEW.ativo = true AND OLD.ativo = false THEN
    UPDATE public.tb_clientes_saas 
    SET status = 'Ativo'
    WHERE aluno_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar status
CREATE TRIGGER trigger_sync_aluno_status
AFTER UPDATE OF ativo ON public.tb_alunos
FOR EACH ROW
EXECUTE FUNCTION public.sync_aluno_status();