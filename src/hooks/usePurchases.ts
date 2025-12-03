import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Purchase {
  id: string;
  dominio: string;
  fornecedor: string | null;
  unidade: string;
  status: string;
  total: number;
  observacoes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  compra_id: string;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_custo: number;
  total: number;
}

export interface PurchaseItemWithStock extends PurchaseItem {
  estoque_atual: number;
}

export const usePurchases = () => {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tb_compras")
        .select("*")
        .eq("dominio", dominio)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPurchaseItems = async (purchaseId: string): Promise<PurchaseItemWithStock[]> => {
    try {
      const { data: items, error } = await supabase
        .from("tb_compras_itens")
        .select("*")
        .eq("compra_id", purchaseId);

      if (error) throw error;

      // Get stock for each product
      const itemsWithStock: PurchaseItemWithStock[] = [];
      for (const item of items || []) {
        const { data: stockData } = await supabase
          .from("tb_estq_unidades")
          .select("quantidade")
          .eq("produto_id", item.produto_id)
          .eq("dominio", dominio)
          .maybeSingle();

        itemsWithStock.push({
          ...item,
          estoque_atual: stockData?.quantidade || 0
        });
      }

      return itemsWithStock;
    } catch (error) {
      console.error("Error fetching purchase items:", error);
      return [];
    }
  };

  const createPurchase = async (items: { produto_id: number; produto_nome: string; quantidade: number; preco_custo: number }[]) => {
    try {
      const total = items.reduce((sum, item) => sum + (item.preco_custo * item.quantidade), 0);

      const { data: purchase, error: purchaseError } = await supabase
        .from("tb_compras")
        .insert({
          dominio,
          unidade: "Matriz",
          status: "pendente",
          total
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const purchaseItems = items.map(item => ({
        compra_id: purchase.id,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_custo: item.preco_custo,
        total: item.preco_custo * item.quantidade
      }));

      const { error: itemsError } = await supabase
        .from("tb_compras_itens")
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      await fetchPurchases();
      toast({ title: "Compra criada com sucesso!" });
      return true;
    } catch (error) {
      console.error("Error creating purchase:", error);
      toast({ title: "Erro ao criar compra", variant: "destructive" });
      return false;
    }
  };

  const updatePurchase = async (purchaseId: string, items: { produto_id: number; produto_nome: string; quantidade: number; preco_custo: number }[]) => {
    try {
      // Delete existing items
      await supabase
        .from("tb_compras_itens")
        .delete()
        .eq("compra_id", purchaseId);

      // Insert new items
      const total = items.reduce((sum, item) => sum + (item.preco_custo * item.quantidade), 0);

      const purchaseItems = items.map(item => ({
        compra_id: purchaseId,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_custo: item.preco_custo,
        total: item.preco_custo * item.quantidade
      }));

      const { error: itemsError } = await supabase
        .from("tb_compras_itens")
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      // Update total
      await supabase
        .from("tb_compras")
        .update({ total })
        .eq("id", purchaseId);

      await fetchPurchases();
      toast({ title: "Compra atualizada com sucesso!" });
      return true;
    } catch (error) {
      console.error("Error updating purchase:", error);
      toast({ title: "Erro ao atualizar compra", variant: "destructive" });
      return false;
    }
  };

  const completePurchase = async (purchaseId: string) => {
    try {
      // Get purchase items
      const { data: items, error: itemsError } = await supabase
        .from("tb_compras_itens")
        .select("*")
        .eq("compra_id", purchaseId);

      if (itemsError) throw itemsError;

      // Update stock for each item
      for (const item of items || []) {
        // Check if stock record exists
        const { data: existing } = await supabase
          .from("tb_estq_unidades")
          .select("id, quantidade")
          .eq("produto_id", item.produto_id)
          .eq("dominio", dominio)
          .eq("unidade_id", 1)
          .maybeSingle();

        if (existing) {
          // Update existing stock
          await supabase
            .from("tb_estq_unidades")
            .update({ quantidade: existing.quantidade + item.quantidade })
            .eq("id", existing.id);
        } else {
          // Create new stock record
          await supabase
            .from("tb_estq_unidades")
            .insert({
              dominio,
              produto_id: item.produto_id,
              unidade_id: 1,
              quantidade: item.quantidade,
              quantidade_minima: 0
            });
        }
      }

      // Update purchase status
      await supabase
        .from("tb_compras")
        .update({ status: "concluida" })
        .eq("id", purchaseId);

      await fetchPurchases();
      toast({ title: "Compra concluída e estoque atualizado!" });
      return true;
    } catch (error) {
      console.error("Error completing purchase:", error);
      toast({ title: "Erro ao concluir compra", variant: "destructive" });
      return false;
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from("tb_compras")
        .delete()
        .eq("id", purchaseId);

      if (error) throw error;

      await fetchPurchases();
      toast({ title: "Compra excluída com sucesso!" });
      return true;
    } catch (error) {
      console.error("Error deleting purchase:", error);
      toast({ title: "Erro ao excluir compra", variant: "destructive" });
      return false;
    }
  };

  const pendingPurchases = purchases.filter(p => p.status === "pendente");
  const completedPurchases = purchases.filter(p => p.status === "concluida");

  return {
    purchases,
    pendingPurchases,
    completedPurchases,
    loading,
    fetchPurchases,
    getPurchaseItems,
    createPurchase,
    updatePurchase,
    completePurchase,
    deletePurchase
  };
};
