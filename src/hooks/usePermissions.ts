import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ModuloPermissao {
  modulo: string;
  visualizar: boolean;
  editar: boolean;
  excluir: boolean;
}

interface UsePermissionsReturn {
  isLoading: boolean;
  permissoes: ModuloPermissao[];
  canView: (modulo: string) => boolean;
  canEdit: (modulo: string) => boolean;
  canDelete: (modulo: string) => boolean;
}

const MODULO_MAP: Record<string, string> = {
  dashboard: "dashboard",
  pdv: "pdv",
  produtos: "produtos",
  clientes: "clientes",
  compras: "compras",
  "contas-pagar": "contas_pagar",
  "contas-receber": "contas_receber",
  "central-contas": "central_contas",
  configuracoes: "configuracoes",
  agenda: "agenda",
};

// Cache global para evitar múltiplas requisições
let cachedPermissoes: ModuloPermissao[] | null = null;
let cacheUserId: string | null = null;
let cachePromise: Promise<ModuloPermissao[]> | null = null;

export function usePermissions(): UsePermissionsReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [permissoes, setPermissoes] = useState<ModuloPermissao[]>([]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Se já temos cache para este usuário, usar imediatamente
      if (cachedPermissoes && cacheUserId === user.id) {
        setPermissoes(cachedPermissoes);
        setIsLoading(false);
        return;
      }

      // Se já tem uma requisição em andamento, aguardar
      if (cachePromise && cacheUserId === user.id) {
        const result = await cachePromise;
        setPermissoes(result);
        setIsLoading(false);
        return;
      }

      cacheUserId = user.id;
      
      // Criar promise e cachear
      cachePromise = (async () => {
        // Get user's grupo_id
        const { data: userData } = await supabase
          .from("tb_usuarios")
          .select("grupo_id")
          .eq("auth_user_id", user.id)
          .single();

        if (!userData?.grupo_id) {
          return [];
        }

        // Get permissions for the group
        const { data: permissoesData } = await supabase
          .from("tb_grupos_permissao_modulos")
          .select("modulo, visualizar, editar, excluir")
          .eq("grupo_id", userData.grupo_id);

        return permissoesData || [];
      })();

      const result = await cachePromise;
      cachedPermissoes = result;
      setPermissoes(result);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setIsLoading(false);
      cachePromise = null;
    }
  };

  const normalizeModulo = useCallback((modulo: string): string => {
    return MODULO_MAP[modulo.toLowerCase()] || modulo.toLowerCase().replace(/-/g, "_");
  }, []);

  const canView = useCallback((modulo: string): boolean => {
    const normalizedModulo = normalizeModulo(modulo);
    const perm = permissoes.find(p => p.modulo === normalizedModulo);
    return perm?.visualizar ?? false;
  }, [permissoes, normalizeModulo]);

  const canEdit = useCallback((modulo: string): boolean => {
    const normalizedModulo = normalizeModulo(modulo);
    const perm = permissoes.find(p => p.modulo === normalizedModulo);
    return perm?.editar ?? false;
  }, [permissoes, normalizeModulo]);

  const canDelete = useCallback((modulo: string): boolean => {
    const normalizedModulo = normalizeModulo(modulo);
    const perm = permissoes.find(p => p.modulo === normalizedModulo);
    return perm?.excluir ?? false;
  }, [permissoes, normalizeModulo]);

  return {
    isLoading,
    permissoes,
    canView,
    canEdit,
    canDelete,
  };
}

// Limpar cache (chamar no logout)
export function clearPermissionsCache() {
  cachedPermissoes = null;
  cacheUserId = null;
  cachePromise = null;
}
