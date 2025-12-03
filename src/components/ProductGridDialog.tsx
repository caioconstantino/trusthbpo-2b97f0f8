import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: number;
  nome: string;
  preco_venda: number;
  categoria_id: number | null;
  imagem_url: string | null;
  codigo: string | null;
}

interface Category {
  id: number;
  nome: string;
}

interface ProductGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (product: { id: string; name: string; price: number }) => void;
}

export const ProductGridDialog = ({ open, onOpenChange, onAddProduct }: ProductGridDialogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    setIsLoading(true);

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("tb_produtos")
          .select("id, nome, preco_venda, categoria_id, imagem_url, codigo")
          .eq("dominio", dominio)
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("tb_categorias")
          .select("id, nome")
          .eq("dominio", dominio)
          .order("nome")
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        setSelectedCategory(categoriesRes.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === null || p.categoria_id === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuy = (product: Product) => {
    onAddProduct({
      id: product.id.toString(),
      name: product.nome,
      price: product.preco_venda || 0
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Grade de Produtos</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-6 mt-2">
          {/* Categories Sidebar */}
          <div className="w-48 space-y-2 overflow-y-auto max-h-[450px]">
            <Button
              variant={selectedCategory === null ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.nome}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto max-h-[450px] pr-2">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando produtos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleBuy(product)}
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {product.imagem_url ? (
                        <img 
                          src={product.imagem_url} 
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">#{product.codigo || product.id}</p>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.nome}</h3>
                      <p className="text-xl font-bold text-primary">
                        R$ {(product.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
