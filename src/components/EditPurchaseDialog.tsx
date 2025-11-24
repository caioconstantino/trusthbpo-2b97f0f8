import { useState } from "react";
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
import { X } from "lucide-react";

interface EditPurchaseDialogProps {
  purchaseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PurchaseProduct {
  barcode: string;
  name: string;
  image: string;
  salePrice: number;
  currentQty: number;
  requestedQty: number;
  totalValue: number;
}

export const EditPurchaseDialog = ({ purchaseId, open, onOpenChange }: EditPurchaseDialogProps) => {
  const [searchProduct, setSearchProduct] = useState("");
  const [products, setProducts] = useState<PurchaseProduct[]>([
    {
      barcode: "123456789",
      name: "Pão",
      image: "🥖",
      salePrice: 9.78,
      currentQty: 5,
      requestedQty: 1,
      totalValue: 9.78
    }
  ]);

  const updateQuantity = (barcode: string, qty: number) => {
    setProducts(products.map(p =>
      p.barcode === barcode
        ? { ...p, requestedQty: qty, totalValue: p.salePrice * qty }
        : p
    ));
  };

  const removeProduct = (barcode: string) => {
    setProducts(products.filter(p => p.barcode !== barcode));
  };

  const totals = {
    quantity: products.reduce((sum, p) => sum + p.requestedQty, 0),
    cost: 0, // Você pode calcular o custo real aqui
    value: products.reduce((sum, p) => sum + p.totalValue, 0)
  };

  const handleSave = () => {
    console.log("Salvar alterações:", products);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Produtos da Compra</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden space-y-4">
          {/* Buscar Produto */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Adicionar Produto
            </label>
            <Input
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Digite o nome ou código de barras..."
            />
          </div>

          {/* Tabela de Produtos */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Cód. Barras</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">P. Venda</TableHead>
                  <TableHead className="text-center">Qtd Atual</TableHead>
                  <TableHead className="text-center">Qtd Solicitada</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.barcode}>
                    <TableCell className="font-medium">{product.barcode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{product.image}</span>
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.salePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">{product.currentQty}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={product.requestedQty}
                        onChange={(e) => updateQuantity(product.barcode, parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto text-center"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {product.totalValue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => removeProduct(product.barcode)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Totais */}
                <TableRow className="bg-muted font-semibold">
                  <TableCell colSpan={4} className="text-right">Totais:</TableCell>
                  <TableCell className="text-center">{totals.quantity}</TableCell>
                  <TableCell className="text-right">{totals.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{totals.value.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4 border-t">
          <Button
            className="w-full h-14 text-lg bg-secondary hover:bg-secondary/90"
            onClick={handleSave}
          >
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
