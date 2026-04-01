import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUnidadeAtivaId } from "@/hooks/useUnidadeAtiva";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Payment {
  method: string;
  value: number;
}

interface SaleData {
  sessionId: string;
  customerName: string;
  cartItems: CartItem[];
  subtotal: number;
  discountPercent: number;
  additionPercent: number;
  total: number;
  change: number;
  payments: Payment[];
}

export const useSales = () => {
  const { toast } = useToast();
  const dominio = localStorage.getItem("user_dominio") || "";
  const unidadeId = getUnidadeAtivaId();

  const saveSale = async (saleData: SaleData): Promise<{ id: string; createdAt: string } | null> => {
    try {
      // Insert the sale
      const { data: venda, error: vendaError } = await supabase
        .from("tb_vendas")
        .insert({
          dominio,
          unidade_id: unidadeId,
          sessao_id: saleData.sessionId,
          cliente_nome: saleData.customerName || null,
          subtotal: saleData.subtotal,
          desconto_percentual: saleData.discountPercent,
          acrescimo_percentual: saleData.additionPercent,
          total: saleData.total,
          troco: saleData.change
        })
        .select()
        .single();

      if (vendaError) {
        toast({
          title: "Erro ao salvar venda",
          description: vendaError.message,
          variant: "destructive"
        });
        return null;
      }

      // Insert sale items
      const itens = saleData.cartItems.map(item => ({
        venda_id: venda.id,
        produto_id: parseInt(item.id),
        produto_nome: item.name,
        quantidade: item.quantity,
        preco_unitario: item.price,
        total: item.price * item.quantity
      }));

      const { error: itensError } = await supabase
        .from("tb_vendas_itens")
        .insert(itens);

      if (itensError) {
        console.error("Error inserting items:", itensError);
      }

      // Insert payments
      const pagamentos = saleData.payments.map(p => ({
        venda_id: venda.id,
        forma_pagamento: p.method,
        valor: p.value
      }));

      const { error: pagamentosError } = await supabase
        .from("tb_vendas_pagamentos")
        .insert(pagamentos);

      if (pagamentosError) {
        console.error("Error inserting payments:", pagamentosError);
      }

      // Fire-and-forget: notify stock sync integrations
      try {
        const prodIds = saleData.cartItems.map(item => parseInt(item.id));
        const { data: prods } = await supabase.from("tb_produtos").select("id, codigo").in("id", prodIds);
        const codeMap = new Map((prods || []).map(p => [p.id, p.codigo]));
        const produtosSync = saleData.cartItems
          .filter(item => codeMap.get(parseInt(item.id)))
          .map(item => ({
            codigo: codeMap.get(parseInt(item.id)),
            quantidade: -item.quantity,
          }));
        if (produtosSync.length > 0) {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "dymdchhxabwaxownoxtz";
          const { data: session } = await supabase.auth.getSession();
          fetch(`https://${projectId}.supabase.co/functions/v1/sync-stock-out`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.session?.access_token || ""}`,
            },
            body: JSON.stringify({ dominio, unidade_id: unidadeId, produtos: produtosSync }),
          }).catch(() => {});
        }
      } catch {}

      return { id: venda.id, createdAt: venda.created_at };
    } catch (error) {
      console.error("Error saving sale:", error);
      toast({
        title: "Erro ao salvar venda",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  return { saveSale };
};
