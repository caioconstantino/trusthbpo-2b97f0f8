import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProductForm } from "@/components/ProductForm";
import { ProductsTable } from "@/components/ProductsTable";
import { PurchaseOrderDialog } from "@/components/PurchaseOrderDialog";
import { CopyProductsDialog } from "@/components/CopyProductsDialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeftRight, Loader2, Copy } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermission } from "@/components/NoPermission";

const Produtos = () => {
  const { canView, canEdit, isLoading: permissionsLoading } = usePermissions();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleProductAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Check permissions after loading
  if (!canView("produtos")) {
    return (
      <DashboardLayout>
        <NoPermission />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowCopyDialog(true)}
            >
              <Copy className="w-4 h-4" />
              COPIAR DE OUTRA EMPRESA
            </Button>
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
        <ProductsTable key={refreshKey} />
      </div>

      {/* Modais */}
      <PurchaseOrderDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
      />
      
      <CopyProductsDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        onSuccess={handleProductAdded}
      />
    </DashboardLayout>
  );
};

export default Produtos;

