import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface ViewPurchaseDialogProps {
  purchaseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PurchaseProduct {
  barcode: string;
  name: string;
  costPrice: number;
  salePrice: number;
  currentQty: number;
  requestedQty: number;
  totalCost: number;
  totalValue: number;
}

export const ViewPurchaseDialog = ({ purchaseId, open, onOpenChange }: ViewPurchaseDialogProps) => {
  // Dados mockados
  const products: PurchaseProduct[] = [
    {
      barcode: "123456789",
      name: "Pão",
      costPrice: 4.00,
      salePrice: 9.78,
      currentQty: 5,
      requestedQty: 1,
      totalCost: 4.00,
      totalValue: 9.78
    }
  ];

  const totals = {
    quantity: products.reduce((sum, p) => sum + p.requestedQty, 0),
    cost: products.reduce((sum, p) => sum + p.totalCost, 0),
    value: products.reduce((sum, p) => sum + p.totalValue, 0)
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Produtos da Compra</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cód. Barras</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">P. Custo</TableHead>
                <TableHead className="text-right">P. Venda</TableHead>
                <TableHead className="text-center">Qtd Atual</TableHead>
                <TableHead className="text-center">Qtd Solicitada</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.barcode}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">
                    R$ {product.costPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {product.salePrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">{product.currentQty}</TableCell>
                  <TableCell className="text-center">{product.requestedQty}</TableCell>
                  <TableCell className="text-right">
                    R$ {product.totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {product.totalValue.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totais */}
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={5} className="text-right">Totais:</TableCell>
                <TableCell className="text-center">{totals.quantity}</TableCell>
                <TableCell className="text-right">
                  CUSTO: R$ {totals.cost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  R$ {totals.value.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
