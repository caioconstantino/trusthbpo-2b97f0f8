import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContaReceber {
  id: string;
  dominio: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  forma_pagamento: string | null;
  cliente: string | null;
  venda_id: string | null;
  data_recebimento: string | null;
  observacoes: string | null;
  created_at: string;
}

export const useContasReceber = (initialFilters?: { startDate?: string; endDate?: string; status?: string }) => {
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    fetchContas(initialFilters);
  }, []);

  const fetchContas = async (filters?: { startDate?: string; endDate?: string; status?: string }) => {
    setLoading(true);
    try {
      let query = supabase
        .from("tb_contas_receber")
        .select("*")
        .eq("dominio", dominio)
        .order("vencimento", { ascending: true });

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
      setContas(data || []);
    } catch (error) {
      console.error("Error fetching contas a receber:", error);
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
    cliente?: string;
  }) => {
    try {
      const { error } = await supabase
        .from("tb_contas_receber")
        .insert({
          dominio,
          categoria: conta.categoria || null,
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento,
          forma_pagamento: conta.forma_pagamento || null,
          cliente: conta.cliente || null,
          status: "pendente"
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error creating conta a receber:", error);
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
      cliente?: string;
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
      toast({ title: `${successCount} receitas cadastradas com sucesso!` });
    } else {
      toast({ 
        title: `${successCount} de ${total} receitas cadastradas`, 
        variant: successCount > 0 ? "default" : "destructive" 
      });
    }

    return successCount;
  };

  const updateConta = async (id: string, updates: Partial<ContaReceber>) => {
    try {
      const { error } = await supabase
        .from("tb_contas_receber")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchContas();
      toast({ title: "Receita atualizada!" });
      return true;
    } catch (error) {
      console.error("Error updating conta a receber:", error);
      toast({ title: "Erro ao atualizar receita", variant: "destructive" });
      return false;
    }
  };

  const receberConta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_contas_receber")
        .update({
          status: "recebido",
          data_recebimento: new Date().toISOString().split('T')[0]
        })
        .eq("id", id);

      if (error) throw error;

      await fetchContas();
      toast({ title: "Receita marcada como recebida!" });
      return true;
    } catch (error) {
      console.error("Error receiving conta:", error);
      toast({ title: "Erro ao receber receita", variant: "destructive" });
      return false;
    }
  };

  const deleteConta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_contas_receber")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchContas();
      toast({ title: "Receita excluída!" });
      return true;
    } catch (error) {
      console.error("Error deleting conta a receber:", error);
      toast({ title: "Erro ao excluir receita", variant: "destructive" });
      return false;
    }
  };

  // Group by category with "VENDAS" first, then "SEM CATEGORIA"
  const groupedContasRaw = contas.reduce((acc, conta) => {
    const cat = conta.categoria || "SEM CATEGORIA";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(conta);
    return acc;
  }, {} as Record<string, ContaReceber[]>);

  // Reorder: VENDAS first, then SEM CATEGORIA, then alphabetically
  const groupedContas: Record<string, ContaReceber[]> = {};
  
  const priorityCategories = ["VENDAS", "SEM CATEGORIA"];
  
  priorityCategories.forEach(cat => {
    if (groupedContasRaw[cat]) {
      groupedContas[cat] = groupedContasRaw[cat];
    }
  });
  
  Object.keys(groupedContasRaw)
    .filter(key => !priorityCategories.includes(key))
    .sort()
    .forEach(key => {
      groupedContas[key] = groupedContasRaw[key];
    });

  const totalPendente = contas
    .filter(c => c.status === "pendente")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  const totalRecebido = contas
    .filter(c => c.status === "recebido")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return {
    contas,
    groupedContas,
    loading,
    totalPendente,
    totalRecebido,
    fetchContas,
    createConta,
    createContasBatch,
    updateConta,
    receberConta,
    deleteConta
  };
};
