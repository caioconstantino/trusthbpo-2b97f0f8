-- Recriar função validar_dominio com SECURITY DEFINER para bypassar RLS
CREATE OR REPLACE FUNCTION public.validar_dominio(p_dominio character varying)
 RETURNS TABLE(existe boolean, nome_cliente character varying, status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.tb_clientes_saas WHERE dominio = p_dominio AND tb_clientes_saas.status = 'Ativo') as existe,
    tb_clientes_saas.razao_social as nome_cliente,
    tb_clientes_saas.status
  FROM public.tb_clientes_saas
  WHERE tb_clientes_saas.dominio = p_dominio
  LIMIT 1;
END;
$function$;