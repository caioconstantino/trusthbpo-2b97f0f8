import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface ProductGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (product: { id: string; name: string; price: number }) => void;
}

const products: Product[] = [
  { id: "1", name: "Pão", price: 9.78, category: "Padaria", image: "🥖" },
  { id: "2", name: "Pão de Queijo", price: 9.98, category: "Padaria", image: "🧀" },
  { id: "3", name: "Arroz Agulinha 1kg", price: 8.99, category: "Mercearia", image: "🍚" },
  { id: "4", name: "Feijão Preto 1kg", price: 7.50, category: "Mercearia", image: "🫘" },
  { id: "5", name: "Maçã", price: 4.99, category: "HortiFruti", image: "🍎" },
  { id: "6", name: "Banana", price: 5.50, category: "HortiFruti", image: "🍌" },
  { id: "7", name: "Picanha 1kg", price: 89.90, category: "Açougue", image: "🥩" },
  { id: "8", name: "Frango 1kg", price: 15.90, category: "Açougue", image: "🍗" },
];

const categories = ["Padaria", "Mercearia", "HortiFruti", "Açougue"];

export const ProductGridDialog = ({ open, onOpenChange, onAddProduct }: ProductGridDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState("Padaria");

  const filteredProducts = products.filter(p => p.category === selectedCategory);

  const handleBuy = (product: Product) => {
    onAddProduct({
      id: product.id,
      name: product.name,
      price: product.price
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Grade de Produtos</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 mt-4">
          {/* Categories Sidebar */}
          <div className="w-48 space-y-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto max-h-[450px] pr-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted flex items-center justify-center text-6xl">
                  {product.image}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-3">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleBuy(product)}
                  >
                    Comprar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
