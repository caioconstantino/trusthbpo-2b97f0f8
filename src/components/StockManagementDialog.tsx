import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";
import { toast } from "sonner";

interface StockManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productId?: number;
}

interface StockByUnit {
  unidade_id: number;
  unidade_nome: string;
  quantidade: number;
}

export const StockManagementDialog = ({ open, onOpenChange, productName, productId }: StockManagementDialogProps) => {
  const { unidades } = useUnidadeAtiva();
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [movementType, setMovementType] = useState("Entrada");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [stockByUnit, setStockByUnit] = useState<StockByUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dominio = localStorage.getItem("user_dominio") || "";

  // Set default unit when dialog opens
  useEffect(() => {
    if (open && unidades.length > 0 && !selectedUnitId) {
      setSelectedUnitId(unidades[0].id.toString());
    }
  }, [open, unidades, selectedUnitId]);

  // Fetch real stock data when dialog opens
  useEffect(() => {
    if (!open || !productId || !dominio) return;

    const fetchStock = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tb_estq_unidades")
          .select("unidade_id, quantidade")
          .eq("produto_id", productId)
          .eq("dominio", dominio);

        if (error) throw error;

        const mapped: StockByUnit[] = unidades.map(u => {
          const found = data?.find(d => d.unidade_id === u.id);
          return {
            unidade_id: u.id,
            unidade_nome: u.nome,
            quantidade: found?.quantidade ?? 0,
          };
        });

        setStockByUnit(mapped);
      } catch (err) {
        console.error("Erro ao buscar estoque:", err);
        toast.error("Erro ao carregar estoque");
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [open, productId, dominio, unidades]);

  const handleSave = async () => {
    if (!productId || !selectedUnitId || !quantity) {
      toast.error("Preencha a quantidade");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    setSaving(true);
    try {
      const unitId = parseInt(selectedUnitId);
      const delta = movementType === "Entrada" ? qty : -qty;

      // Check if stock record exists for this product+unit
      const { data: existing, error: fetchErr } = await supabase
        .from("tb_estq_unidades")
        .select("id, quantidade")
        .eq("produto_id", productId)
        .eq("unidade_id", unitId)
        .eq("dominio", dominio)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        const newQty = Math.max(0, existing.quantidade + delta);
        const { error: updateErr } = await supabase
          .from("tb_estq_unidades")
          .update({ quantidade: newQty, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateErr) throw updateErr;
      } else {
        const newQty = movementType === "Entrada" ? qty : 0;
        const { error: insertErr } = await supabase
          .from("tb_estq_unidades")
          .insert({
            produto_id: productId,
            unidade_id: unitId,
            dominio,
            quantidade: newQty,
            quantidade_minima: 0,
          });
        if (insertErr) throw insertErr;
      }

      // Sync stock out (fire-and-forget)
      try {
        const { data: prod } = await supabase
          .from("tb_produtos")
          .select("codigo")
          .eq("id", productId)
          .maybeSingle();

        if (prod?.codigo) {
          const { data: updatedStock } = await supabase
            .from("tb_estq_unidades")
            .select("quantidade")
            .eq("produto_id", productId)
            .eq("unidade_id", unitId)
            .eq("dominio", dominio)
            .maybeSingle();

          supabase.functions.invoke("sync-stock-out", {
            body: {
              dominio,
              unidade_id: unitId,
              produtos: [{ codigo: prod.codigo, quantidade: updatedStock?.quantidade ?? 0 }],
            },
          }).catch(() => {});
        }
      } catch {}

      toast.success(`Estoque ${movementType === "Entrada" ? "adicionado" : "removido"} com sucesso`);
      handleReset();

      // Refresh stock display
      const { data: refreshed } = await supabase
        .from("tb_estq_unidades")
        .select("unidade_id, quantidade")
        .eq("produto_id", productId)
        .eq("dominio", dominio);

      setStockByUnit(unidades.map(u => {
        const found = refreshed?.find(d => d.unidade_id === u.id);
        return { unidade_id: u.id, unidade_nome: u.nome, quantidade: found?.quantidade ?? 0 };
      }));
    } catch (err) {
      console.error("Erro ao salvar estoque:", err);
      toast.error("Erro ao salvar movimentação de estoque");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setQuantity("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Estoque - {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock-unit">Unidade</Label>
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger id="stock-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stock-quantity">Quantidade</Label>
              <Input
                id="stock-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="movement-type">Tipo da Movimentação</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger id="movement-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stock-description">Descrição</Label>
              <Input
                id="stock-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição"
              />
            </div>
          </div>

          {/* Tabela de Estoque Atual */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-muted p-3 font-semibold text-sm">
              <div>Unidade</div>
              <div>Quantidade</div>
            </div>
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Carregando...</div>
            ) : stockByUnit.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Nenhum estoque registrado</div>
            ) : (
              stockByUnit.map((item) => (
                <div
                  key={item.unidade_id}
                  className="grid grid-cols-2 p-3 border-t text-sm"
                >
                  <div>{item.unidade_nome}</div>
                  <div>{item.quantidade}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
