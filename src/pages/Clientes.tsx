import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerForm } from "@/components/CustomerForm";
import { CustomersTable } from "@/components/CustomersTable";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermission } from "@/components/NoPermission";

const Clientes = () => {
  const { canView, canEdit, isLoading: permissionsLoading } = usePermissions();
  
  const handleCustomerAdded = () => {
    console.log("Cliente adicionado");
  };

  // Check permissions after loading
  if (!permissionsLoading && !canView("clientes")) {
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
