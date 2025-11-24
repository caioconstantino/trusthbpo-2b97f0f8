import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { OperationalSection } from "@/components/OperationalSection";
import { Button } from "@/components/ui/button";
import { Package, Archive, FileText } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("operacional");

  // Dados de exemplo baseados na imagem
  const branchesData = [
    {
      name: "MULTI",
      sales: 1,
      products: 7334,
      total: 69737.50,
      cost: 59278.48,
      categories: [
        { name: "Desconhecida", totalSold: 69737.50 }
      ]
    },
    {
      name: "TREZE",
      sales: 1,
      products: 2411,
      total: 18835.00,
      cost: 16008.24,
      categories: [
        { name: "Desconhecida", totalSold: 18835.00 }
      ]
    },
    {
      name: "ITAPE",
      sales: 1,
      products: 4667,
      total: 31817.00,
      cost: 27050.10,
      categories: [
        { name: "Desconhecida", totalSold: 31817.00 }
      ]
    }
  ];

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
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab("operacional")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "operacional"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="w-4 h-4" />
            Operacional
          </button>
          <button
            onClick={() => setActiveTab("estoque")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "estoque"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-4 h-4" />
            Estoque
          </button>
          <button
            onClick={() => setActiveTab("fiscal")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "fiscal"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Fiscal
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "operacional" && (
          <div className="space-y-4">
            {branchesData.map((branch) => (
              <OperationalSection key={branch.name} branch={branch} />
            ))}
          </div>
        )}

        {activeTab === "estoque" && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Conteúdo de Estoque será implementado aqui</p>
          </div>
        )}

        {activeTab === "fiscal" && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Conteúdo Fiscal será implementado aqui</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
