import { Eye } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

export interface StockData {
  name: string;
  pieces: number;
  stockValue: number;
  stockCost: number;
  units: number;
  expectedProfit: number;
  hasAlert?: boolean;
}

interface StockSectionProps {
  stock: StockData;
  value: string;
}

export const StockSection = ({ stock, value }: StockSectionProps) => {
  return (
    <AccordionItem value={value} className="border border-border rounded-lg overflow-hidden">
      <AccordionTrigger className="bg-dataSection text-dataSection-foreground px-6 py-4 hover:no-underline hover:bg-dataSection/90">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="uppercase font-bold">{stock.name}</span>
          <span className="opacity-80">- PEÇAS EM ESTOQUE:</span>
          <span className="font-bold bg-card text-foreground px-2 py-0.5 rounded">{stock.pieces}</span>
          <span className="opacity-80">| VALOR ESTOQUE:</span>
          <span className="font-bold">R$ {stock.stockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="opacity-80">| CUSTO ESTOQUE:</span>
          <span className="font-bold">R$ {stock.stockCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="bg-card pb-6">
        <div className="p-6 space-y-6">
          {/* Alert */}
          {stock.hasAlert && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertDescription className="flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-200 font-medium">
                  Alguns Produtos Precisam da Sua Atenção!!
                </span>
                <Button 
                  size="sm" 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Ver Produtos
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Products Card */}
            <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium mb-4 opacity-90">
                Total de produtos no estoque
              </h3>
              <p className="text-5xl font-bold mb-2">{stock.units}</p>
              <p className="text-sm opacity-90">Unidades</p>
            </div>

            {/* Movements Card */}
            <div className="bg-amber-500 text-white rounded-lg p-6">
              <h3 className="text-sm font-medium mb-4 text-center">
                Movimentações
              </h3>
              <div className="flex items-center justify-between mt-8">
                <span className="text-sm">Saída Transferência</span>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-secondary text-secondary-foreground rounded-lg p-6">
            <h3 className="text-center text-sm font-semibold mb-6">
              Resumo Financeiro
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">
                  R$ {stock.stockCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-medium">Custo do Estoque</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">
                  R$ {stock.expectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-medium">Lucro Esperado</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-slate-700 hover:bg-slate-800 text-white"
              size="lg"
            >
              VER ESTOQUE COMPLETO
            </Button>
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              PRODUTOS MAIS VENDIDOS
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
