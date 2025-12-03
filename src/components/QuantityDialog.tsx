import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface QuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (product: Product, quantity: number) => void;
}

export const QuantityDialog = ({ open, onOpenChange, product, onConfirm }: QuantityDialogProps) => {
  const [quantity, setQuantity] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuantity("1");
      // Focus and select the input after dialog opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!product) return;
    const qty = parseInt(quantity) || 1;
    if (qty > 0) {
      onConfirm(product, qty);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  if (!product) return null;

  const total = (product.price * (parseInt(quantity) || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Quantidade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-semibold text-lg">{product.name}</p>
            <p className="text-primary text-xl font-bold">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Quantity Input */}
          <div>
            <Label htmlFor="quantity" className="text-sm text-muted-foreground">
              Quantidade
            </Label>
            <Input
              ref={inputRef}
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              min="1"
              className="mt-1 text-center text-2xl font-bold h-14"
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
