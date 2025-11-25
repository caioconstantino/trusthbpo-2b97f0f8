import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { OperationalSection } from "@/components/OperationalSection";
import { StockSection } from "@/components/StockSection";
import { DashboardTutorial } from "@/components/DashboardTutorial";
import { Accordion } from "@/components/ui/accordion";
import { Package, Archive, FileText } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("operacional");
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem("hasSeenDashboardTutorial");
    if (!hasSeenTutorial) {
      setTutorialOpen(true);
      localStorage.setItem("hasSeenDashboardTutorial", "true");
    }
  }, []);

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

  const stockData = [
    {
      name: "TREZE",
      pieces: 3746,
      stockValue: 27077.50,
      stockCost: 23020.92,
      units: 3746,
      expectedProfit: 4056.58,
      hasAlert: false
    },
    {
      name: "MATRIZ",
      pieces: 4267,
      stockValue: 38302.50,
      stockCost: 32561.65,
      units: 4267,
      expectedProfit: 5740.85,
      hasAlert: true
    }
  ];

  return (
    <DashboardLayout onTutorialClick={() => setTutorialOpen(true)}>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div id="metric-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="flex gap-2 md:gap-4 border-b border-border overflow-x-auto">
          <button
            id="operacional-tab"
            onClick={() => setActiveTab("operacional")}
            className={`flex items-center gap-2 px-3 md:px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "operacional"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-sm md:text-base">Operacional</span>
          </button>
          <button
            id="estoque-tab"
            onClick={() => setActiveTab("estoque")}
            className={`flex items-center gap-2 px-3 md:px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "estoque"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="text-sm md:text-base">Estoque</span>
          </button>
          <button
            id="fiscal-tab"
            onClick={() => setActiveTab("fiscal")}
            className={`flex items-center gap-2 px-3 md:px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "fiscal"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm md:text-base">Fiscal</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "operacional" && (
          <div id="branches-section">
            <Accordion type="single" collapsible className="space-y-4">
              {branchesData.map((branch, index) => (
                <OperationalSection 
                  key={branch.name} 
                  branch={branch} 
                  value={`branch-${index}`}
                />
              ))}
            </Accordion>
          </div>
        )}

        {activeTab === "estoque" && (
          <Accordion type="single" collapsible className="space-y-4">
            {stockData.map((stock, index) => (
              <StockSection 
                key={stock.name} 
                stock={stock} 
                value={`stock-${index}`}
              />
            ))}
          </Accordion>
        )}

        {activeTab === "fiscal" && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Conteúdo Fiscal será implementado aqui</p>
          </div>
        )}
      </div>

      {/* Tutorial */}
      <DashboardTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </DashboardLayout>
  );
};

export default Index;
