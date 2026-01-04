import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUnidadeAtivaId } from "@/hooks/useUnidadeAtiva";

export interface ContaPagar {
  id: string;
  dominio: string;
  unidade_id: number | null;
  categoria: string | null;
  descricao: string;
  valor: number;
  valor_pago: number;
  vencimento: string;
  status: string;
  forma_pagamento: string | null;
  fornecedor: string | null;
  compra_id: string | null;
  data_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
}

export const useContasPagar = (initialFilters?: { startDate?: string; endDate?: string; status?: string }) => {
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const dominio = localStorage.getItem("user_dominio") || "";
  const unidadeId = getUnidadeAtivaId();

  useEffect(() => {
    fetchContas(initialFilters);
  }, []);

  const fetchContas = async (filters?: { startDate?: string; endDate?: string; status?: string }) => {
    setLoading(true);
    try {
      let query = supabase
        .from("tb_contas_pagar")
        .select("*")
        .eq("dominio", dominio)
        .order("vencimento", { ascending: true });

      if (unidadeId) {
        query = query.eq("unidade_id", unidadeId);
      }

      if (filters?.startDate) {
        query = query.gte("vencimento", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("vencimento", filters.endDate);
      }
      if (filters?.status && filters.status !== "Todos") {
        query = query.eq("status", filters.status.toLowerCase());
      }

      const { data, error } = await query;

      if (error) throw error;
      setContas((data || []) as ContaPagar[]);
    } catch (error) {
      console.error("Error fetching contas:", error);
    } finally {
      setLoading(false);
    }
  };

  const createConta = async (conta: {
    categoria?: string;
    descricao: string;
    valor: number;
    vencimento: string;
    forma_pagamento?: string;
    fornecedor?: string;
  }) => {
    try {
      const { error } = await supabase
        .from("tb_contas_pagar")
        .insert({
          dominio,
          unidade_id: unidadeId,
          categoria: conta.categoria || null,
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento,
          forma_pagamento: conta.forma_pagamento || null,
          fornecedor: conta.fornecedor || null,
          status: "pendente"
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error creating conta:", error);
      return false;
    }
  };

  const createContasBatch = async (
    contasData: Array<{
      categoria?: string;
      descricao: string;
      valor: number;
      vencimento: string;
      forma_pagamento?: string;
      fornecedor?: string;
    }>,
    onProgress?: (current: number, total: number) => void
  ) => {
    let successCount = 0;
    const total = contasData.length;

    for (let i = 0; i < total; i++) {
      const conta = contasData[i];
      const success = await createConta(conta);
      if (success) successCount++;
      onProgress?.(i + 1, total);
    }

    if (successCount === total) {
      toast({ title: `${successCount} contas cadastradas com sucesso!` });
    } else {
      toast({ 
        title: `${successCount} de ${total} contas cadastradas`, 
        variant: successCount > 0 ? "default" : "destructive" 
      });
    }

    return successCount;
  };

  const updateConta = async (id: string, updates: Partial<ContaPagar>) => {
    try {
      const { error } = await supabase
        .from("tb_contas_pagar")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchContas();
      toast({ title: "Conta atualizada!" });
      return true;
    } catch (error) {
      console.error("Error updating conta:", error);
      toast({ title: "Erro ao atualizar conta", variant: "destructive" });
      return false;
    }
  };

  const pagarConta = async (id: string, valorPago?: number) => {
    try {
      // Find the conta to get current values
      const conta = contas.find(c => c.id === id);
      if (!conta) throw new Error("Conta não encontrada");

      const valorTotal = Number(conta.valor);
      const valorJaPago = Number(conta.valor_pago || 0);
      const valorPagamento = valorPago !== undefined ? valorPago : (valorTotal - valorJaPago);
      const novoValorPago = valorJaPago + valorPagamento;
      
      // Determine new status
      const novoStatus = novoValorPago >= valorTotal ? "pago" : "parcial";

      const { error } = await supabase
        .from("tb_contas_pagar")
        .update({
          status: novoStatus,
          valor_pago: novoValorPago,
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .eq("id", id);

      if (error) throw error;

      await fetchContas();
      
      if (novoStatus === "pago") {
        toast({ title: "Conta marcada como paga!" });
      } else {
        const restante = valorTotal - novoValorPago;
        toast({ title: `Pagamento parcial registrado! Faltam R$ ${restante.toFixed(2)}` });
      }
      return true;
    } catch (error) {
      console.error("Error paying conta:", error);
      toast({ title: "Erro ao pagar conta", variant: "destructive" });
      return false;
    }
  };

  const deleteConta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_contas_pagar")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchContas();
      toast({ title: "Conta excluída!" });
      return true;
    } catch (error) {
      console.error("Error deleting conta:", error);
      toast({ title: "Erro ao excluir conta", variant: "destructive" });
      return false;
    }
  };

  // Group by category with "COMPRAS" first, then "SEM CATEGORIA"
  const groupedContasRaw = contas.reduce((acc, conta) => {
    const cat = conta.categoria || "SEM CATEGORIA";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(conta);
    return acc;
  }, {} as Record<string, ContaPagar[]>);

  // Reorder: COMPRAS first, then SEM CATEGORIA, then alphabetically
  const groupedContas: Record<string, ContaPagar[]> = {};
  
  // Priority categories in order
  const priorityCategories = ["COMPRAS", "SEM CATEGORIA"];
  
  priorityCategories.forEach(cat => {
    if (groupedContasRaw[cat]) {
      groupedContas[cat] = groupedContasRaw[cat];
    }
  });
  
  // Then add remaining categories alphabetically
  Object.keys(groupedContasRaw)
    .filter(key => !priorityCategories.includes(key))
    .sort()
    .forEach(key => {
      groupedContas[key] = groupedContasRaw[key];
    });

  const totalPendente = contas
    .filter(c => c.status === "pendente" || c.status === "parcial")
    .reduce((sum, c) => sum + (Number(c.valor) - Number(c.valor_pago || 0)), 0);

  const totalPago = contas
    .reduce((sum, c) => sum + Number(c.valor_pago || 0), 0);

  return {
    contas,
    groupedContas,
    loading,
    totalPendente,
    totalPago,
    fetchContas,
    createConta,
    createContasBatch,
    updateConta,
    pagarConta,
    deleteConta
  };
};
