import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PurchaseItem {
  id: string;
  name: string;
  currentStock: number;
  quantityToBuy: number;
  image: string;
}

export const PurchaseOrderDialog = ({ open, onOpenChange }: PurchaseOrderDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: "1",
      name: "Pão",
      currentStock: 5,
      quantityToBuy: 100,
      image: "🥖"
    },
    {
      id: "2",
      name: "Pão de Queijo",
      currentStock: 15,
      quantityToBuy: 50,
      image: "🧀"
    }
  ]);

  const handleQuantityChange = (id: string, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantityToBuy: parseInt(value) || 0 } : item
    ));
  };

  const handleRemove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = () => {
    console.log("Salvar pedido de compra:", items);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido de Compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Campo de Busca */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Produto
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou código do produto"
              className="w-full"
            />
          </div>

          {/* Tabela de Produtos */}
          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 bg-muted p-3 font-medium text-sm">
                <div>Produto</div>
                <div>Quantidade Atual</div>
                <div>QTD. Comprar</div>
                <div>Ações</div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 p-3 border-t items-center"
                >
                  {/* Produto */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-2xl">
                      {item.image}
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>

                  {/* Quantidade Atual */}
                  <div className="text-sm text-center">{item.currentStock}</div>

                  {/* Quantidade a Comprar */}
                  <div>
                    <Input
                      type="number"
                      value={item.quantityToBuy}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="text-center"
                      min="0"
                    />
                  </div>

                  {/* Ações */}
                  <div className="flex justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} size="lg">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
