import { useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

interface CategoryData {
  name: string;
  totalSold: number;
}

export interface BranchData {
  name: string;
  sales: number;
  products: number;
  total: number;
  cost: number;
  categories: CategoryData[];
}

interface OperationalSectionProps {
  branch: BranchData;
  value: string;
}

export const OperationalSection = ({ branch, value }: OperationalSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState("categoria");

  return (
    <AccordionItem value={value} className="border border-border rounded-lg overflow-hidden">
      <AccordionTrigger className="bg-dataSection text-dataSection-foreground px-6 py-4 hover:no-underline hover:bg-dataSection/90">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="uppercase font-bold">{branch.name}</span>
          <span className="opacity-80">- VENDAS:</span>
          <span className="font-bold">{branch.sales}</span>
          <span className="opacity-80">({branch.products} PRODUTOS)</span>
          <span className="opacity-80">| TOTAL:</span>
          <span className="font-bold">R$ {branch.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="opacity-80">| CUSTO:</span>
          <span className="font-bold">R$ {branch.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="bg-card pb-0">
        {/* Sub Tabs */}
        <div className="border-b border-border px-6 py-3">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSubTab("categoria")}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeSubTab === "categoria"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Categoria
            </button>
            <button
              onClick={() => setActiveSubTab("pagamento")}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeSubTab === "pagamento"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Forma de Pagamento
            </button>
            <button
              onClick={() => setActiveSubTab("pdv")}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeSubTab === "pdv"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              PDV
            </button>
            <button
              onClick={() => setActiveSubTab("vendedor")}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeSubTab === "vendedor"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Vendedor
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6">
          {activeSubTab === "categoria" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Categoria
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Total Vendido
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branch.categories.map((category, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{category.name}</td>
                      <td className="py-3 px-4 text-sm text-foreground text-right">
                        {category.totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeSubTab === "pagamento" && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de forma de pagamento disponível
            </div>
          )}
          {activeSubTab === "pdv" && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de PDV disponível
            </div>
          )}
          {activeSubTab === "vendedor" && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de vendedor disponível
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
