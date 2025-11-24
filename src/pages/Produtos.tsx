import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProductForm } from "@/components/ProductForm";
import { ProductsTable } from "@/components/ProductsTable";
import { PurchaseOrderDialog } from "@/components/PurchaseOrderDialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeftRight } from "lucide-react";

const Produtos = () => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  
  const handleProductAdded = () => {
    // Callback quando um produto é adicionado
    console.log("Produto adicionado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="gap-2 bg-slate-700 hover:bg-slate-800 text-white"
              onClick={() => setShowPurchaseDialog(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              PEDIDO DE COMPRA
            </Button>
            <Button variant="secondary" className="gap-2 bg-slate-700 hover:bg-slate-800 text-white">
              <ArrowLeftRight className="w-4 h-4" />
              TRANSFERÊNCIA
            </Button>
          </div>
        </div>

        {/* Formulário de Novo Produto */}
        <ProductForm onProductAdded={handleProductAdded} />

        {/* Tabela de Produtos */}
        <ProductsTable />
      </div>

      {/* Modais */}
      <PurchaseOrderDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
      />
    </DashboardLayout>
  );
};

export default Produtos;

