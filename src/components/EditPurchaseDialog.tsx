import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { X, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditPurchaseDialogProps {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface PurchaseItem {
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_custo: number;
  estoque_atual: number;
}

interface Product {
  id: number;
  nome: string;
  preco_custo: number;
}

export const EditPurchaseDialog = ({ purchaseId, open, onOpenChange, onSave }: EditPurchaseDialogProps) => {
  const { toast } = useToast();
  const [searchProduct, setSearchProduct] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    if (open) {
      loadProducts();
      if (purchaseId) {
        loadItems();
      } else {
        setItems([]);
      }
    }
  }, [open, purchaseId]);

  useEffect(() => {
    if (searchProduct.length > 0) {
      const filtered = products.filter(p =>
        p.nome.toLowerCase().includes(searchProduct.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowSearch(true);
    } else {
      setFilteredProducts([]);
      setShowSearch(false);
    }
  }, [searchProduct, products]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("tb_produtos")
      .select("id, nome, preco_custo")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (data) setProducts(data);
  };

  const loadItems = async () => {
    if (!purchaseId) return;
    setLoading(true);

    try {
      const { data: purchaseItems, error } = await supabase
        .from("tb_compras_itens")
        .select("*")
        .eq("compra_id", purchaseId);

      if (error) throw error;

      const itemsWithStock: PurchaseItem[] = [];
      for (const item of purchaseItems || []) {
        const { data: stockData } = await supabase
          .from("tb_estq_unidades")
          .select("quantidade")
          .eq("produto_id", item.produto_id)
          .eq("dominio", dominio)
          .maybeSingle();

        itemsWithStock.push({
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: item.quantidade,
          preco_custo: Number(item.preco_custo),
          estoque_atual: stockData?.quantidade || 0
        });
      }

      setItems(itemsWithStock);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Product) => {
    const existing = items.find(i => i.produto_id === product.id);
    if (existing) {
      setItems(items.map(i =>
        i.produto_id === product.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ));
    } else {
      const { data: stockData } = await supabase
        .from("tb_estq_unidades")
        .select("quantidade")
        .eq("produto_id", product.id)
        .eq("dominio", dominio)
        .maybeSingle();

      setItems([...items, {
        produto_id: product.id,
        produto_nome: product.nome,
        quantidade: 1,
        preco_custo: Number(product.preco_custo) || 0,
        estoque_atual: stockData?.quantidade || 0
      }]);
    }
    setSearchProduct("");
    setShowSearch(false);
  };

  const updateQuantity = (produtoId: number, qty: number) => {
    if (qty <= 0) {
      removeProduct(produtoId);
      return;
    }
    setItems(items.map(i =>
      i.produto_id === produtoId ? { ...i, quantidade: qty } : i
    ));
  };

  const updateCost = (produtoId: number, cost: number) => {
    setItems(items.map(i =>
      i.produto_id === produtoId ? { ...i, preco_custo: cost } : i
    ));
  };

  const removeProduct = (produtoId: number) => {
    setItems(items.filter(i => i.produto_id !== produtoId));
  };

  const totals = {
    quantidade: items.reduce((sum, i) => sum + i.quantidade, 0),
    custo: items.reduce((sum, i) => sum + (i.preco_custo * i.quantidade), 0)
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (purchaseId) {
        // Update existing purchase
        await supabase
          .from("tb_compras_itens")
          .delete()
          .eq("compra_id", purchaseId);

        const purchaseItems = items.map(item => ({
          compra_id: purchaseId,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: item.quantidade,
          preco_custo: item.preco_custo,
          total: item.preco_custo * item.quantidade
        }));

        await supabase.from("tb_compras_itens").insert(purchaseItems);

        await supabase
          .from("tb_compras")
          .update({ total: totals.custo })
          .eq("id", purchaseId);
      } else {
        // Create new purchase
        const { data: purchase, error } = await supabase
          .from("tb_compras")
          .insert({
            dominio,
            unidade: "Matriz",
            status: "pendente",
            total: totals.custo
          })
          .select()
          .single();

        if (error) throw error;

        const purchaseItems = items.map(item => ({
          compra_id: purchase.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: item.quantidade,
          preco_custo: item.preco_custo,
          total: item.preco_custo * item.quantidade
        }));

        await supabase.from("tb_compras_itens").insert(purchaseItems);
      }

      toast({ title: purchaseId ? "Compra atualizada!" : "Compra criada!" });
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{purchaseId ? "Editar Compra" : "Nova Compra"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden space-y-3">
          {/* Search Product */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Buscar produto para adicionar..."
              className="pl-10"
            />
            {showSearch && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between"
                    onClick={() => addProduct(product)}
                  >
                    <span className="text-sm">{product.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      Custo: R$ {(Number(product.preco_custo) || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right w-32">P. Custo</TableHead>
                    <TableHead className="text-center w-24">Estoque</TableHead>
                    <TableHead className="text-center w-24">Qtd</TableHead>
                    <TableHead className="text-right w-28">Total</TableHead>
                    <TableHead className="w-16">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Adicione produtos à compra
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.produto_id}>
                        <TableCell className="font-medium text-sm">{item.produto_nome}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.preco_custo}
                            onChange={(e) => updateCost(item.produto_id, parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-sm text-right"
                            step="0.01"
                            min="0"
                          />
                        </TableCell>
                        <TableCell className="text-center text-sm">{item.estoque_atual}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => updateQuantity(item.produto_id, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-sm text-center mx-auto"
                            min="1"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          R$ {(item.preco_custo * item.quantidade).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => removeProduct(item.produto_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  
                  {items.length > 0 && (
                    <TableRow className="bg-muted font-semibold">
                      <TableCell colSpan={3} className="text-right">Totais:</TableCell>
                      <TableCell className="text-center">{totals.quantidade}</TableCell>
                      <TableCell className="text-right">R$ {totals.custo.toFixed(2)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3 border-t">
          <Button
            className="w-full h-12"
            onClick={handleSave}
            disabled={saving || items.length === 0}
          >
            {saving ? "Salvando..." : "Salvar Compra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
