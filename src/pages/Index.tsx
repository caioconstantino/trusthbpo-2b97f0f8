import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { DataSection } from "@/components/DataSection";
import { Button } from "@/components/ui/button";
import { Package, Archive, FileText } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Vendas"
            value="R$ 0,00"
            subtitle="Custo: R$ 0,00"
            variant="sales"
          />
          <MetricCard
            title="Contas a receber (HOJE)"
            value="R$ 0,00"
            subtitle="Vencidas: R$ 0,00"
            variant="receivable"
          />
          <MetricCard
            title="Despesas (HOJE)"
            value="R$ 0,00"
            variant="expenses"
          />
        </div>

        {/* Action Tabs */}
        <div className="flex gap-4 border-b border-border pb-4">
          <Button variant="outline" className="gap-2">
            <Package className="w-4 h-4" />
            Operacional
          </Button>
          <Button variant="ghost" className="gap-2">
            <Archive className="w-4 h-4" />
            Estoque
          </Button>
          <Button variant="ghost" className="gap-2">
            <FileText className="w-4 h-4" />
            Fiscal
          </Button>
        </div>

        {/* Data Section */}
        <DataSection />
      </div>
    </DashboardLayout>
  );
};

export default Index;
