import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CompletePurchaseDialogProps {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const CompletePurchaseDialog = ({
  purchaseId,
  open,
  onOpenChange,
  onComplete
}: CompletePurchaseDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [registerPayable, setRegisterPayable] = useState(true);
  const [fornecedor, setFornecedor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("boleto");
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    if (open && purchaseId) {
      loadPurchaseData();
      // Set default due date to 30 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setVencimento(defaultDate.toISOString().split('T')[0]);
    }
  }, [open, purchaseId]);

  const loadPurchaseData = async () => {
    if (!purchaseId) return;

    const { data } = await supabase
      .from("tb_compras")
      .select("total, fornecedor")
      .eq("id", purchaseId)
      .single();

    if (data) {
      setPurchaseTotal(Number(data.total));
      setFornecedor(data.fornecedor || "");
    }
  };

  const handleComplete = async () => {
    if (!purchaseId) return;

    setLoading(true);
    try {
      // Get purchase items
      const { data: items, error: itemsError } = await supabase
        .from("tb_compras_itens")
        .select("*")
        .eq("compra_id", purchaseId);

      if (itemsError) throw itemsError;

      // Update stock for each item
      for (const item of items || []) {
        const { data: existing } = await supabase
          .from("tb_estq_unidades")
          .select("id, quantidade")
          .eq("produto_id", item.produto_id)
          .eq("dominio", dominio)
          .eq("unidade_id", 1)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("tb_estq_unidades")
            .update({ quantidade: existing.quantidade + item.quantidade })
            .eq("id", existing.id);
        } else {
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

        // Update product cost price
        await supabase
          .from("tb_produtos")
          .update({ preco_custo: item.preco_custo })
          .eq("id", item.produto_id);
      }

      // Update purchase status and fornecedor
      await supabase
        .from("tb_compras")
        .update({ 
          status: "concluida",
          fornecedor: fornecedor || null
        })
        .eq("id", purchaseId);

      // TODO: Register payable if checkbox is checked
      // This would need a tb_contas_pagar table
      if (registerPayable && vencimento) {
        // For now, just log it - you can implement the payables table later
        console.log("Conta a pagar:", {
          fornecedor,
          valor: purchaseTotal,
          vencimento,
          formaPagamento
        });
      }

      toast({ title: "Compra concluída!", description: "Estoque atualizado com sucesso." });
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing purchase:", error);
      toast({ title: "Erro ao concluir compra", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Concluir Compra</DialogTitle>
          <DialogDescription>
            Confirme os dados para concluir a compra e atualizar o estoque
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Valor Total da Compra</p>
            <p className="text-2xl font-bold">R$ {purchaseTotal.toFixed(2)}</p>
          </div>

          <div>
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input
              id="fornecedor"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Nome do fornecedor"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="registerPayable"
              checked={registerPayable}
              onCheckedChange={(checked) => setRegisterPayable(checked === true)}
            />
            <Label htmlFor="registerPayable" className="cursor-pointer">
              Registrar conta a pagar
            </Label>
          </div>

          {registerPayable && (
            <div className="space-y-3 pl-6 border-l-2 border-muted">
              <div>
                <Label htmlFor="vencimento">Data de Vencimento</Label>
                <Input
                  id="vencimento"
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Concluir Compra"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
