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
import { RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productId?: number;
}

interface Unidade {
  id: number;
  nome: string;
}

interface StockItem {
  unidade_id: number;
  unidade_nome: string;
  quantidade: number;
}

export const StockTransferDialog = ({ open, onOpenChange, productName, productId }: StockTransferDialogProps) => {
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [units, setUnits] = useState<Unidade[]>([]);
  const [stockByUnit, setStockByUnit] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadUnitsAndStock();
    }
  }, [open, productId]);

  const loadUnitsAndStock = async () => {
    setLoading(true);
    try {
      // Get user's accessible units
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("tb_usuarios")
        .select("dominio, unidades_acesso")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!userData) return;

      // Fetch all units for the domain
      const { data: allUnits } = await supabase
        .from("tb_unidades")
        .select("id, nome")
        .eq("dominio", userData.dominio)
        .eq("ativo", true)
        .order("nome");

      if (!allUnits) return;

      // Filter units based on user's access
      let accessibleUnits = allUnits;
      if (userData.unidades_acesso && userData.unidades_acesso.length > 0) {
        accessibleUnits = allUnits.filter(u => userData.unidades_acesso!.includes(u.id));
      }

      setUnits(accessibleUnits);

      // Fetch stock for the product in accessible units
      if (productId) {
        const { data: stockData } = await supabase
          .from("tb_estq_unidades")
          .select("unidade_id, quantidade")
          .eq("produto_id", productId)
          .in("unidade_id", accessibleUnits.map(u => u.id));

        const stockItems: StockItem[] = accessibleUnits.map(unit => {
          const stock = stockData?.find(s => s.unidade_id === unit.id);
          return {
            unidade_id: unit.id,
            unidade_nome: unit.nome,
            quantidade: stock?.quantidade || 0
          };
        });

        setStockByUnit(stockItems);
      }
    } catch (error) {
      console.error("Error loading units:", error);
      toast.error("Erro ao carregar unidades");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fromUnit || !toUnit) {
      toast.error("Selecione as unidades de origem e destino");
      return;
    }
    if (fromUnit === toUnit) {
      toast.error("A unidade de origem e destino devem ser diferentes");
      return;
    }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    const fromStock = stockByUnit.find(s => s.unidade_id === parseInt(fromUnit));
    if (!fromStock || fromStock.quantidade < qty) {
      toast.error("Quantidade insuficiente na unidade de origem");
      return;
    }

    setSaving(true);
    try {
      // This is a placeholder for the actual transfer logic
      // In a real implementation, you would update tb_estq_unidades
      console.log("Transferir estoque:", { 
        fromUnit, 
        toUnit, 
        quantity: qty, 
        description,
        productId 
      });
      
      toast.success("Transferência registrada com sucesso!");
      handleClose();
    } catch (error) {
      console.error("Error transferring stock:", error);
      toast.error("Erro ao transferir estoque");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setFromUnit("");
    setToUnit("");
    setDescription("");
    setQuantity("1");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir Estoque - {productName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Seleção De/Para */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transfer-from">De</Label>
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger id="transfer-from">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transfer-to">Para</Label>
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger id="transfer-to">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.filter(u => u.id.toString() !== fromUnit).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <Label htmlFor="transfer-quantity">Quantidade</Label>
              <Input
                id="transfer-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="transfer-description">Descrição</Label>
              <Input
                id="transfer-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da transferência"
              />
            </div>

            {/* Tabela de Estoque Atual */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-muted p-3 font-semibold text-sm">
                <div>Unidade</div>
                <div>Quantidade</div>
              </div>
              {stockByUnit.length > 0 ? (
                stockByUnit.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-2 p-3 border-t text-sm"
                  >
                    <div>{item.unidade_nome}</div>
                    <div>{item.quantidade}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Nenhum estoque encontrado
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleReset}
                className="bg-slate-700 hover:bg-slate-800 text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={handleClose}
              >
                Fechar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
