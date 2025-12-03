import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const saveSale = async (saleData: SaleData): Promise<boolean> => {
    try {
      // Insert the sale
      const { data: venda, error: vendaError } = await supabase
        .from("tb_vendas")
        .insert({
          dominio,
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
        return false;
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

      return true;
    } catch (error) {
      console.error("Error saving sale:", error);
      toast({
        title: "Erro ao salvar venda",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  return { saveSale };
};
