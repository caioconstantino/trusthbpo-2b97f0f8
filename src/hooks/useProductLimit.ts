import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductLimitData {
  totalProdutos: number;
  limiteBase: number;
  produtosAdicionais: number;
  limiteTotal: number;
  isBasico: boolean;
  isPro: boolean;
  podecadastrar: boolean;
  isLoading: boolean;
}

const LIMITE_BASE_BASICO = 500;
const PRECO_PACOTE_PRODUTOS = 20; // R$ 20,00 por +500 produtos

export const useProductLimit = () => {
  const [data, setData] = useState<ProductLimitData>({
    totalProdutos: 0,
    limiteBase: LIMITE_BASE_BASICO,
    produtosAdicionais: 0,
    limiteTotal: LIMITE_BASE_BASICO,
    isBasico: true,
    isPro: false,
    podecadastrar: true,
    isLoading: true,
  });

  const fetchProductLimit = async () => {
    const dominio = localStorage.getItem("user_dominio");
    const unidadeId = localStorage.getItem("unidade_ativa_id");
    if (!dominio) return;

    try {
      // Fetch client data to get plan and produtos_adicionais
      const { data: clienteResponse } = await supabase.functions.invoke("get-customer-data", {
        body: { dominio }
      });

      const cliente = clienteResponse?.cliente;
      const plano = cliente?.plano || "Básico";
      const isBasico = !plano.toLowerCase().includes("pro") && !plano.toLowerCase().includes("profissional");
      const isPro = !isBasico;
      const produtosAdicionais = cliente?.produtos_adicionais || 0;

      // Count total products for this domain/unit (always count, regardless of plan)
      let query = supabase
        .from("tb_produtos")
        .select("id", { count: "exact", head: true })
        .eq("dominio", dominio);

      if (unidadeId) {
        query = query.eq("unidade_id", parseInt(unidadeId));
      }

      const { count } = await query;
      const totalProdutos = count || 0;
      
      // Calculate limit: base (500) + adicionais (500 each) - only for basic plan
      const limiteTotal = isPro ? Infinity : LIMITE_BASE_BASICO + (produtosAdicionais * 500);

      setData({
        totalProdutos,
        limiteBase: isPro ? 0 : LIMITE_BASE_BASICO,
        produtosAdicionais: isPro ? 0 : produtosAdicionais,
        limiteTotal,
        isBasico,
        isPro,
        podecadastrar: isPro || totalProdutos < limiteTotal,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching product limit:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchProductLimit();
    
    // Listen for storage changes (when switching companies)
    const handleStorageChange = () => {
      fetchProductLimit();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    ...data,
    refetch: fetchProductLimit,
    PRECO_PACOTE_PRODUTOS,
  };
};
