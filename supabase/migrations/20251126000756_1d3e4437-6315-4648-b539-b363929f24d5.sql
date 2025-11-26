-- Corrigir função validar_dominio - desambiguar coluna status
CREATE OR REPLACE FUNCTION public.validar_dominio(p_dominio VARCHAR)
RETURNS TABLE(existe BOOLEAN, nome_cliente VARCHAR, status VARCHAR)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.tb_clientes WHERE dominio = p_dominio AND tb_clientes.status = 'Ativo') as existe,
    tb_clientes.razao_social as nome_cliente,
    tb_clientes.status
  FROM public.tb_clientes
  WHERE tb_clientes.dominio = p_dominio
  LIMIT 1;
END;
$$;