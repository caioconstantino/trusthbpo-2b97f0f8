import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Unidade {
  id: number;
  nome: string;
  dominio: string;
  endereco_cidade: string | null;
  endereco_estado: string | null;
}

// Cache global
let cachedUnidades: Unidade[] | null = null;
let cacheDominio: string | null = null;
let cachePromise: Promise<Unidade[]> | null = null;

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
      // Se já temos cache para este domínio, usar imediatamente
      if (cachedUnidades && cacheDominio === dominio) {
        setUnidades(cachedUnidades);
        selectStoredUnidade(cachedUnidades);
        setIsLoading(false);
        return;
      }

      // Se já tem uma requisição em andamento, aguardar
      if (cachePromise && cacheDominio === dominio) {
        const result = await cachePromise;
        setUnidades(result);
        selectStoredUnidade(result);
        setIsLoading(false);
        return;
      }

      cacheDominio = dominio;

      // Get user's unit access permissions
      const unidadesAcessoStr = localStorage.getItem("user_unidades_acesso");
      const unidadesAcesso: number[] = unidadesAcessoStr ? JSON.parse(unidadesAcessoStr) : [];

      cachePromise = (async () => {
        let query = supabase
          .from("tb_unidades")
          .select("id, nome, dominio, endereco_cidade, endereco_estado")
          .eq("dominio", dominio)
          .eq("ativo", true);

        if (unidadesAcesso.length > 0) {
          query = query.in("id", unidadesAcesso);
        }

        const { data, error } = await query.order("nome");
        if (error) throw error;
        return (data || []) as Unidade[];
      })();

      const unidadesData = await cachePromise;
      cachedUnidades = unidadesData;
      setUnidades(unidadesData);
      selectStoredUnidade(unidadesData);
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
    } finally {
      setIsLoading(false);
      cachePromise = null;
    }
  }, []);

  const selectStoredUnidade = (unidadesData: Unidade[]) => {
    const storedUnidadeId = localStorage.getItem("unidade_ativa_id");
    if (storedUnidadeId) {
      const stored = unidadesData.find(u => u.id === parseInt(storedUnidadeId));
      if (stored) {
        setUnidadeAtiva(stored);
      } else if (unidadesData.length > 0) {
        setUnidadeAtiva(unidadesData[0]);
        localStorage.setItem("unidade_ativa_id", unidadesData[0].id.toString());
      }
    } else if (unidadesData.length > 0) {
      setUnidadeAtiva(unidadesData[0]);
      localStorage.setItem("unidade_ativa_id", unidadesData[0].id.toString());
    }
  };

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

// Helper function to get unidade_id from localStorage
export function getUnidadeAtivaId(): number | null {
  const stored = localStorage.getItem("unidade_ativa_id");
  return stored ? parseInt(stored) : null;
}

// Limpar cache (chamar no logout)
export function clearUnidadeCache() {
  cachedUnidades = null;
  cacheDominio = null;
  cachePromise = null;
}
