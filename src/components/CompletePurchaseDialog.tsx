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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format, addMonths } from "date-fns";

interface Parcela {
  numero: number;
  vencimento: string;
  valor: number;
  formaPagamento: string;
}

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
  const [numParcelas, setNumParcelas] = useState(1);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    if (open && purchaseId) {
      loadPurchaseData();
    }
  }, [open, purchaseId]);

  useEffect(() => {
    if (purchaseTotal > 0) {
      generateParcelas(numParcelas);
    }
  }, [numParcelas, purchaseTotal]);

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
      setNumParcelas(1);
    }
  };

  const generateParcelas = (num: number) => {
    const valorParcela = purchaseTotal / num;
    const novasParcelas: Parcela[] = [];
    const hoje = new Date();

    for (let i = 0; i < num; i++) {
      const dataVencimento = addMonths(hoje, i + 1);
      novasParcelas.push({
        numero: i + 1,
        vencimento: format(dataVencimento, "yyyy-MM-dd"),
        valor: i === num - 1 ? purchaseTotal - valorParcela * (num - 1) : valorParcela,
        formaPagamento: "boleto"
      });
    }

    setParcelas(novasParcelas);
  };

  const updateParcela = (index: number, field: keyof Parcela, value: string | number) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index] = { ...novasParcelas[index], [field]: value };
    setParcelas(novasParcelas);
  };

  const handleComplete = async () => {
    if (!purchaseId) return;

    setLoading(true);
    try {
      const { data: items, error: itemsError } = await supabase
        .from("tb_compras_itens")
        .select("*")
        .eq("compra_id", purchaseId);

      if (itemsError) throw itemsError;

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

        await supabase
          .from("tb_produtos")
          .update({ preco_custo: item.preco_custo })
          .eq("id", item.produto_id);
      }

      await supabase
        .from("tb_compras")
        .update({ 
          status: "concluida",
          fornecedor: fornecedor || null
        })
        .eq("id", purchaseId);

      if (registerPayable && parcelas.length > 0) {
        const contasAInserir = parcelas.map((parcela) => ({
          dominio,
          categoria: "COMPRAS",
          descricao: parcelas.length > 1 
            ? `Compra - ${fornecedor || 'Sem fornecedor'} (${parcela.numero}/${parcelas.length})`
            : `Compra - ${fornecedor || 'Sem fornecedor'}`,
          valor: parcela.valor,
          vencimento: parcela.vencimento,
          status: "pendente",
          forma_pagamento: parcela.formaPagamento,
          fornecedor: fornecedor || null,
          compra_id: purchaseId
        }));

        await supabase.from("tb_contas_pagar").insert(contasAInserir);
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

  const totalParcelas = parcelas.reduce((sum, p) => sum + p.valor, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div>
                <Label>Número de Parcelas</Label>
                <Select value={numParcelas.toString()} onValueChange={(v) => setNumParcelas(parseInt(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x {n === 1 ? "(À vista)" : `de R$ ${(purchaseTotal / n).toFixed(2)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Parcelas</Label>
                {parcelas.map((parcela, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Parcela {parcela.numero}/{parcelas.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Vencimento</Label>
                        <Input
                          type="date"
                          value={parcela.vencimento}
                          onChange={(e) => updateParcela(index, "vencimento", e.target.value)}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={parcela.valor}
                          onChange={(e) => updateParcela(index, "valor", parseFloat(e.target.value) || 0)}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Forma Pgto</Label>
                        <Select
                          value={parcela.formaPagamento}
                          onValueChange={(v) => updateParcela(index, "formaPagamento", v)}
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm">
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
                  </div>
                ))}

                {Math.abs(totalParcelas - purchaseTotal) > 0.01 && (
                  <p className="text-xs text-destructive">
                    Atenção: Total das parcelas (R$ {totalParcelas.toFixed(2)}) difere do valor da compra
                  </p>
                )}
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
