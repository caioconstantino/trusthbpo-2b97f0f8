import { DashboardLayout } from "@/components/DashboardLayout";

const Clientes = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">Gerencie seus clientes aqui.</p>
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
