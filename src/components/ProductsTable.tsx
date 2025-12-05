import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Pencil, Trash2, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { EditProductSheet } from "./EditProductSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUnidadeAtivaId } from "@/hooks/useUnidadeAtiva";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Product {
  id: number;
  codigo: string | null;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  imagem_url: string | null;
  categoria_id: number | null;
  tipo: string | null;
  codigo_barras: string | null;
  observacao: string | null;
  unidade_id: number | null;
}

export const ProductsTable = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const fetchProducts = async () => {
    const dominio = localStorage.getItem("user_dominio");
    const unidadeId = getUnidadeAtivaId();
    if (!dominio) return;

    setLoading(true);
    
    let query = supabase
      .from("tb_produtos")
      .select("*")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (unidadeId) {
      query = query.eq("unidade_id", unidadeId);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }

    setProducts((data || []) as Product[]);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;

    const { error } = await supabase
      .from("tb_produtos")
      .update({ ativo: false })
      .eq("id", deleteProductId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Produto excluído!",
      description: "O produto foi removido com sucesso.",
    });

    setDeleteProductId(null);
    fetchProducts();
  };

  const handleProductUpdated = () => {
    fetchProducts();
    setIsEditSheetOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20"></TableHead>
              <TableHead>Cod.</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">P. Custo</TableHead>
              <TableHead className="text-right">P. Venda</TableHead>
              <TableHead className="w-24 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum produto cadastrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {product.imagem_url ? (
                        <img
                          src={product.imagem_url}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {product.codigo || "-"}
                  </TableCell>
                  <TableCell>{product.nome}</TableCell>
                  <TableCell className="text-right">
                    {product.preco_custo.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.preco_venda.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-slate-700 hover:bg-slate-800 text-white"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => setDeleteProductId(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditProductSheet
        product={editingProduct}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onProductUpdated={handleProductUpdated}
      />

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};