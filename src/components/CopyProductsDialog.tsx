import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";

interface Unidade {
  id: number;
  nome: string;
}

interface Product {
  id: number;
  nome: string;
  codigo: string | null;
  preco_venda: number | null;
  preco_custo: number | null;
}

interface CopyProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CopyProductsDialog = ({ open, onOpenChange, onSuccess }: CopyProductsDialogProps) => {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [sourceUnidade, setSourceUnidade] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);

  const currentUnidadeId = localStorage.getItem("unidade_ativa_id");

  useEffect(() => {
    if (open) {
      fetchUnidades();
      setSourceUnidade("");
      setProducts([]);
      setSelectedProducts([]);
    }
  }, [open]);

  const fetchUnidades = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    const { data, error } = await supabase
      .from("tb_unidades")
      .select("id, nome")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      // Filter out current unidade
      const filtered = data.filter(u => u.id.toString() !== currentUnidadeId);
      setUnidades(filtered);
    }
  };

  const fetchProducts = async (unidadeId: string) => {
    setLoading(true);
    const dominio = localStorage.getItem("user_dominio");

    const { data, error } = await supabase
      .from("tb_produtos")
      .select("id, nome, codigo, preco_venda, preco_custo")
      .eq("dominio", dominio)
      .eq("unidade_id", parseInt(unidadeId))
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleSourceChange = (value: string) => {
    setSourceUnidade(value);
    setSelectedProducts([]);
    fetchProducts(value);
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCopy = async () => {
    if (!currentUnidadeId || selectedProducts.length === 0) return;

    setCopying(true);
    const dominio = localStorage.getItem("user_dominio");

    try {
      // Get full product data for selected products
      const { data: productsData, error: fetchError } = await supabase
        .from("tb_produtos")
        .select("*")
        .in("id", selectedProducts);

      if (fetchError) throw fetchError;

      // Create new products with current unidade_id
      const newProducts = productsData?.map(p => ({
        dominio: dominio,
        unidade_id: parseInt(currentUnidadeId),
        codigo: p.codigo,
        nome: p.nome,
        tipo: p.tipo,
        categoria_id: null, // Categories are per unidade, so we don't copy
        preco_custo: p.preco_custo,
        preco_venda: p.preco_venda,
        codigo_barras: p.codigo_barras,
        observacao: p.observacao,
        imagem_url: p.imagem_url,
        ativo: true
      })) || [];

      const { error: insertError } = await supabase
        .from("tb_produtos")
        .insert(newProducts);

      if (insertError) throw insertError;

      toast({
        title: "Produtos copiados!",
        description: `${selectedProducts.length} produto(s) copiado(s) com sucesso.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao copiar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copiar Produtos de Outra Empresa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Copiar de:</Label>
            <Select value={sourceUnidade} onValueChange={handleSourceChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a empresa de origem" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourceUnidade && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Produtos ({products.length})</Label>
                {products.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedProducts.length === products.length
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado nesta empresa.
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-md p-2">
                  <div className="space-y-2">
                    {products.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => handleSelectProduct(product.id)}
                      >
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.codigo && `#${product.codigo} • `}
                            R$ {(product.preco_venda || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCopy}
            disabled={selectedProducts.length === 0 || copying}
          >
            {copying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
