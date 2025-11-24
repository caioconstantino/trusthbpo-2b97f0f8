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

interface StockTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
}

export const StockTransferDialog = ({ open, onOpenChange, productName }: StockTransferDialogProps) => {
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [description, setDescription] = useState("");

  // Estoque atual por unidade
  const stockByUnit = [
    { unit: "Matriz", quantity: 5 }
  ];

  const units = ["Matriz", "Treze", "Itape", "Multi"];

  const handleSave = () => {
    console.log("Transferir estoque:", { fromUnit, toUnit, description });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleReset = () => {
    setFromUnit("");
    setToUnit("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir Estoque</DialogTitle>
        </DialogHeader>

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
                    <SelectItem key={unit} value={unit}>
                      {unit}
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
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
