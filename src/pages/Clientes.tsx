import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerForm } from "@/components/CustomerForm";
import { CustomersTable } from "@/components/CustomersTable";

const Clientes = () => {
  const handleCustomerAdded = () => {
    console.log("Cliente adicionado");
  };

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
