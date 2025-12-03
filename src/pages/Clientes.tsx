import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerForm } from "@/components/CustomerForm";
import { CustomersTable } from "@/components/CustomersTable";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermission } from "@/components/NoPermission";
import { Loader2 } from "lucide-react";

const Clientes = () => {
  const { canView, canEdit, isLoading: permissionsLoading } = usePermissions();
  
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
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>

        {/* Formulário de Novo Cliente */}
        <CustomerForm onCustomerAdded={handleCustomerAdded} />

        {/* Tabela de Clientes */}
        <CustomersTable />
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
