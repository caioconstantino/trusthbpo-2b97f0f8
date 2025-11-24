import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Pencil, ArrowLeftRight, Plus, Info } from "lucide-react";
import { StockManagementDialog } from "./StockManagementDialog";
import { StockTransferDialog } from "./StockTransferDialog";

interface EditProductSheetProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductSheet = ({ productId, open, onOpenChange }: EditProductSheetProps) => {
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Dados mockados do produto
  const productData = {
    internalCode: "1",
    barcode: "123456789",
    name: "Pão",
    description: "Sem observação",
    category: "Padaria",
    costPrice: "4.78",
    salePrice: "9.78",
    isPopular: false,
    currentStock: 5,
    lastEntry: "24/11/2025",
    totalStock: 5,
    minStock: 0,
    sold: 0.00,
    profit: 0.00,
    salesCount: 0
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Produto</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Códigos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-internal-code" className="text-xs text-muted-foreground">
                  Cod. Interno
                </Label>
                <Input
                  id="edit-internal-code"
                  defaultValue={productData.internalCode}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-barcode" className="text-xs text-muted-foreground">
                  Cod. Barras
                </Label>
                <Input
                  id="edit-barcode"
                  defaultValue={productData.barcode}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Produto */}
            <div>
              <Label htmlFor="edit-product-name" className="text-xs text-muted-foreground">
                Produto
              </Label>
              <Input
                id="edit-product-name"
                defaultValue={productData.name}
                className="mt-1"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="edit-description" className="text-xs text-muted-foreground">
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                defaultValue={productData.description}
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="edit-category" className="text-xs text-muted-foreground">
                Categoria
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="edit-category"
                  defaultValue={productData.category}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cost-price" className="text-xs text-muted-foreground">
                  Preço Custo
                </Label>
                <Input
                  id="edit-cost-price"
                  type="number"
                  step="0.01"
                  defaultValue={productData.costPrice}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-sale-price" className="text-xs text-muted-foreground">
                  Preço Venda
                </Label>
                <Input
                  id="edit-sale-price"
                  type="number"
                  step="0.01"
                  defaultValue={productData.salePrice}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Popular Status */}
            {!productData.isPopular && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>Produto não popular</span>
              </div>
            )}

            {/* Estoque */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Estoque Atual</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{productData.currentStock}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowStockDialog(true)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowTransferDialog(true)}
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Última Entrada</Label>
                  <div className="text-lg font-semibold mt-1">{productData.lastEntry}</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                TOTAL: {productData.totalStock}
              </div>
              <div className="text-xs text-muted-foreground">
                Estoque Mínimo: {productData.minStock}
              </div>
            </div>

            {/* Filtro */}
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" className="gap-2">
                Filtrar
              </Button>
            </div>

            {/* Vendas e Lucro */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center">
                <div className="text-sm mb-1">Vendido</div>
                <div className="text-2xl font-bold">
                  R$ {productData.sold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1">{productData.salesCount} Vendas</div>
              </div>
              <div className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center">
                <div className="text-sm mb-1">Lucro</div>
                <div className="text-2xl font-bold">
                  R$ {productData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <Button className="w-full" size="lg">
              Salvar Alterações
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modais */}
      <StockManagementDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        productName={productData.name}
      />
      <StockTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        productName={productData.name}
      />
    </>
  );
};
