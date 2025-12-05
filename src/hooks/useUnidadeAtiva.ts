import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Unidade {
  id: number;
  nome: string;
  dominio: string;
  endereco_cidade: string | null;
  endereco_estado: string | null;
}

export function useUnidadeAtiva() {
  const [unidadeAtiva, setUnidadeAtiva] = useState<Unidade | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnidades = useCallback(async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) {
      setIsLoading(false);
      return;
    }

    try {
      // Get user's unit access permissions
      const unidadesAcessoStr = localStorage.getItem("user_unidades_acesso");
      const unidadesAcesso: number[] = unidadesAcessoStr ? JSON.parse(unidadesAcessoStr) : [];

      let query = supabase
        .from("tb_unidades")
        .select("id, nome, dominio, endereco_cidade, endereco_estado")
        .eq("dominio", dominio)
        .eq("ativo", true);

      // Filter by user's accessible units if they have restrictions
      if (unidadesAcesso.length > 0) {
        query = query.in("id", unidadesAcesso);
      }

      const { data, error } = await query.order("nome");

      if (error) throw error;

      const unidadesData = data as Unidade[];
      setUnidades(unidadesData);

      // Check if there's a stored unidade
      const storedUnidadeId = localStorage.getItem("unidade_ativa_id");
      if (storedUnidadeId) {
        const stored = unidadesData.find(u => u.id === parseInt(storedUnidadeId));
        if (stored) {
          setUnidadeAtiva(stored);
        } else if (unidadesData.length > 0) {
          // Stored unidade no longer exists, use first one
          setUnidadeAtiva(unidadesData[0]);
          localStorage.setItem("unidade_ativa_id", unidadesData[0].id.toString());
        }
      } else if (unidadesData.length > 0) {
        // No stored unidade, use first one
        setUnidadeAtiva(unidadesData[0]);
        localStorage.setItem("unidade_ativa_id", unidadesData[0].id.toString());
      }
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  const selecionarUnidade = useCallback((unidade: Unidade) => {
    setUnidadeAtiva(unidade);
    localStorage.setItem("unidade_ativa_id", unidade.id.toString());
  }, []);

  const clearUnidadeAtiva = useCallback(() => {
    setUnidadeAtiva(null);
    localStorage.removeItem("unidade_ativa_id");
  }, []);

  return {
    unidadeAtiva,
    unidades,
    isLoading,
    selecionarUnidade,
    clearUnidadeAtiva,
    refreshUnidades: fetchUnidades,
  };
}

// Helper function to get unidade_id from localStorage (for use in queries without the hook)
export function getUnidadeAtivaId(): number | null {
  const stored = localStorage.getItem("unidade_ativa_id");
  return stored ? parseInt(stored) : null;
}
