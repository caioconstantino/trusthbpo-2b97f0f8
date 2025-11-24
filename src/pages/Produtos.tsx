import { DashboardLayout } from "@/components/DashboardLayout";

const Produtos = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
        <p className="text-muted-foreground">Gerencie seus produtos aqui.</p>
      </div>
    </DashboardLayout>
  );
};

export default Produtos;
