import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ViewPurchaseDialogProps {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PurchaseItem {
  id: string;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_custo: number;
  total: number;
  estoque_atual: number;
}

export const ViewPurchaseDialog = ({ purchaseId, open, onOpenChange }: ViewPurchaseDialogProps) => {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    if (open && purchaseId) {
      loadItems();
    }
  }, [open, purchaseId]);

  const loadItems = async () => {
    if (!purchaseId) return;
    setLoading(true);

    try {
      const { data: purchaseItems, error } = await supabase
        .from("tb_compras_itens")
        .select("*")
        .eq("compra_id", purchaseId);

      if (error) throw error;

      const itemsWithStock: PurchaseItem[] = [];
      for (const item of purchaseItems || []) {
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

      setItems(itemsWithStock);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    quantidade: items.reduce((sum, p) => sum + p.quantidade, 0),
    custo: items.reduce((sum, p) => sum + p.total, 0)
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Produtos da Compra</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto nesta compra
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">P. Custo</TableHead>
                  <TableHead className="text-center">Estoque Atual</TableHead>
                  <TableHead className="text-center">Qtd Compra</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.produto_nome}</TableCell>
                    <TableCell className="text-right">
                      R$ {Number(item.preco_custo).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">{item.estoque_atual}</TableCell>
                    <TableCell className="text-center">{item.quantidade}</TableCell>
                    <TableCell className="text-right">
                      R$ {Number(item.total).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="bg-muted font-semibold">
                  <TableCell colSpan={3} className="text-right">Totais:</TableCell>
                  <TableCell className="text-center">{totals.quantidade}</TableCell>
                  <TableCell className="text-right">
                    R$ {totals.custo.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
