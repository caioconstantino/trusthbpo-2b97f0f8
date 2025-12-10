import { useState, useEffect } from "react";
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

      // Get user's grupo_id
      const { data: userData } = await supabase
        .from("tb_usuarios")
        .select("grupo_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData?.grupo_id) {
        // User has no group - no permissions
        setPermissoes([]);
        setIsLoading(false);
        return;
      }

      // Get permissions for the group
      const { data: permissoesData } = await supabase
        .from("tb_grupos_permissao_modulos")
        .select("modulo, visualizar, editar, excluir")
        .eq("grupo_id", userData.grupo_id);

      if (permissoesData) {
        setPermissoes(permissoesData);
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeModulo = (modulo: string): string => {
    return MODULO_MAP[modulo.toLowerCase()] || modulo.toLowerCase().replace(/-/g, "_");
  };

  const canView = (modulo: string): boolean => {
    const normalizedModulo = normalizeModulo(modulo);
    const perm = permissoes.find(p => p.modulo === normalizedModulo);
    return perm?.visualizar ?? false;
  };

  const canEdit = (modulo: string): boolean => {
    const normalizedModulo = normalizeModulo(modulo);
    const perm = permissoes.find(p => p.modulo === normalizedModulo);
    return perm?.editar ?? false;
  };

  const canDelete = (modulo: string): boolean => {
    const normalizedModulo = normalizeModulo(modulo);
    const perm = permissoes.find(p => p.modulo === normalizedModulo);
    return perm?.excluir ?? false;
  };

  return {
    isLoading,
    permissoes,
    canView,
    canEdit,
    canDelete,
  };
}
