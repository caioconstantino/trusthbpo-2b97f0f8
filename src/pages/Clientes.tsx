import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerForm } from "@/components/CustomerForm";
import { CustomersTable } from "@/components/CustomersTable";
import { CustomerKanban } from "@/components/CustomerKanban";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermission } from "@/components/NoPermission";
import { Loader2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

const Clientes = () => {
  const { canView, canEdit, isLoading: permissionsLoading } = usePermissions();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  
  const handleCustomerAdded = () => {
    console.log("Cliente adicionado");
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
  if (!canView("clientes")) {
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
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabela</span>
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
          </div>
        </div>

        {/* Formulário de Novo Cliente */}
        <CustomerForm onCustomerAdded={handleCustomerAdded} />

        {/* View Content */}
        {viewMode === "table" ? <CustomersTable /> : <CustomerKanban />}
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
