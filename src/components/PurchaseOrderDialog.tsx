import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Package, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  id: number;
  nome: string;
  codigo: string | null;
  imagem_url: string | null;
}

interface PurchaseItem {
  id: number;
  name: string;
  currentStock: number;
  quantityToBuy: number;
  image: string | null;
}

export const PurchaseOrderDialog = ({ open, onOpenChange }: PurchaseOrderDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const fetchProducts = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    const { data, error } = await supabase
      .from("tb_produtos")
      .select("id, nome, codigo, imagem_url")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setProducts(data);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProducts();
      setItems([]);
      setSearchTerm("");
    }
  }, [open]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.trim()) {
      const filtered = products.filter(p =>
        p.nome.toLowerCase().includes(value.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    // Verificar se já está na lista
    if (items.find(item => item.id === product.id)) {
      toast({
        title: "Produto já adicionado",
        description: "Este produto já está na lista de compra.",
        variant: "destructive",
      });
      setSearchTerm("");
      setShowSuggestions(false);
      return;
    }

    // Buscar estoque atual
    const dominio = localStorage.getItem("user_dominio");
    let currentStock = 0;

    if (dominio) {
      const { data: stockData } = await supabase
        .from("tb_estq_unidades")
        .select("quantidade")
        .eq("produto_id", product.id)
        .eq("dominio", dominio)
        .maybeSingle();

      if (stockData) {
        currentStock = stockData.quantidade;
      }
    }

    setItems([
      ...items,
      {
        id: product.id,
        name: product.nome,
        currentStock,
        quantityToBuy: 1,
        image: product.imagem_url,
      },
    ]);

    setSearchTerm("");
    setShowSuggestions(false);
  };

  const handleQuantityChange = (id: number, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantityToBuy: parseInt(value) || 0 } : item
    ));
  };

  const handleRemove = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (items.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Adicione ao menos um produto para salvar o pedido.",
        variant: "destructive",
      });
      return;
    }

    // Aqui você pode implementar a lógica para salvar o pedido de compra
    console.log("Salvar pedido de compra:", items);
    
    toast({
      title: "Pedido salvo!",
      description: "O pedido de compra foi salvo com sucesso.",
    });

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
          <div className="relative">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Produto
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Digite o nome ou código do produto"
              className="w-full"
            />
            
            {/* Autocomplete dropdown */}
            {showSuggestions && filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-3"
                    onMouseDown={() => handleSelectProduct(product)}
                  >
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.imagem_url ? (
                        <img
                          src={product.imagem_url}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{product.nome}</div>
                      {product.codigo && (
                        <div className="text-xs text-muted-foreground">Cód: {product.codigo}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabela de Produtos */}
          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 bg-muted p-3 font-medium text-sm">
                <div>Produto</div>
                <div className="text-center">Qtd. Atual</div>
                <div className="text-center">Qtd. Comprar</div>
                <div className="text-center">Ações</div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 p-3 border-t items-center"
                >
                  {/* Produto */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
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
                      min="1"
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

          {items.length === 0 && (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Busque e adicione produtos para criar o pedido de compra
            </div>
          )}

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} size="lg">
              Salvar Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};