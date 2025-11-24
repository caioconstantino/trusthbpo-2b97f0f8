import { useState } from "react";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { EditProductSheet } from "./EditProductSheet";

interface Product {
  id: string;
  code: string;
  name: string;
  costPrice: number;
  salePrice: number;
  image?: string;
}

export const ProductsTable = () => {
  const [products] = useState<Product[]>([
    {
      id: "1",
      code: "123456789",
      name: "Pão",
      costPrice: 4.78,
      salePrice: 9.78,
      image: "🥖"
    },
    {
      id: "2",
      code: "12345678",
      name: "Pão de Queijo",
      costPrice: 6.99,
      salePrice: 9.98,
      image: "🧀"
    },
    {
      id: "3",
      code: "1234567",
      name: "Arroz Agulinha 1kg",
      costPrice: 7.69,
      salePrice: 8.99,
      image: "🍚"
    }
  ]);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const handleEdit = (id: string) => {
    setEditingProductId(id);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Deletar produto:", id);
  };

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
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-2xl">
                  {product.image}
                </div>
              </TableCell>
              <TableCell className="font-medium text-primary">{product.code}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell className="text-right">
                {product.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                {product.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-slate-700 hover:bg-slate-800 text-white"
                    onClick={() => handleEdit(product.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <EditProductSheet
      productId={editingProductId}
      open={isEditSheetOpen}
      onOpenChange={setIsEditSheetOpen}
    />
    </>
  );
};
