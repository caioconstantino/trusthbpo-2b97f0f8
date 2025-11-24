import { useState } from "react";
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

interface StockManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
}

export const StockManagementDialog = ({ open, onOpenChange, productName }: StockManagementDialogProps) => {
  const [unit, setUnit] = useState("Matriz");
  const [movementType, setMovementType] = useState("Entrada");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  // Estoque atual por unidade
  const stockByUnit = [
    { unit: "Matriz", quantity: 5 }
  ];

  const handleSave = () => {
    console.log("Salvar movimento de estoque:", { unit, movementType, quantity, description });
    onOpenChange(false);
  };

  const handleClose = () => {
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
          <DialogTitle>Adicionar Estoque</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Formulário de Entrada */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock-unit">Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="stock-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matriz">Matriz</SelectItem>
                  <SelectItem value="Treze">Treze</SelectItem>
                  <SelectItem value="Itape">Itape</SelectItem>
                  <SelectItem value="Multi">Multi</SelectItem>
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
            {stockByUnit.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 p-3 border-t text-sm"
              >
                <div>{item.unit}</div>
                <div>{item.quantity}</div>
              </div>
            ))}
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
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
