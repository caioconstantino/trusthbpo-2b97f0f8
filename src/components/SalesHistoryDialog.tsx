import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Receipt, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface SalesHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

interface Sale {
  id: string;
  cliente_nome: string | null;
  total: number;
  created_at: string;
  pagamentos: { forma_pagamento: string; valor: number }[];
  itens: { produto_nome: string; quantidade: number; preco_unitario: number }[];
}

export const SalesHistoryDialog = ({
  open,
  onOpenChange,
  sessionId
}: SalesHistoryDialogProps) => {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  useEffect(() => {
    if (open && sessionId) {
      loadSales();
    }
  }, [open, sessionId]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const { data: vendas, error } = await supabase
        .from("tb_vendas")
        .select("id, cliente_nome, total, created_at")
        .eq("sessao_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (vendas && vendas.length > 0) {
        const salesWithDetails: Sale[] = await Promise.all(
          vendas.map(async (venda) => {
            const [{ data: pagamentos }, { data: itens }] = await Promise.all([
              supabase
                .from("tb_vendas_pagamentos")
                .select("forma_pagamento, valor")
                .eq("venda_id", venda.id),
              supabase
                .from("tb_vendas_itens")
                .select("produto_nome, quantidade, preco_unitario")
                .eq("venda_id", venda.id)
            ]);

            return {
              ...venda,
              pagamentos: pagamentos || [],
              itens: itens || []
            };
          })
        );

        setSales(salesWithDetails);
      } else {
        setSales([]);
      }
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (sales.length === 0) {
      toast({
        title: "Nenhuma venda",
        description: "Não há vendas para exportar",
        variant: "destructive"
      });
      return;
    }

    const totalGeral = sales.reduce((sum, s) => sum + Number(s.total), 0);
    
    const salesRows = sales.map(sale => {
      const hora = format(new Date(sale.created_at), "HH:mm", { locale: ptBR });
      const pagamentos = sale.pagamentos.map(p => p.forma_pagamento).join(", ");
      const itensText = sale.itens.map(i => `${i.quantidade}x ${i.produto_nome}`).join("; ");
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${hora}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sale.cliente_nome || "N/I"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px;">${itensText}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pagamentos}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">R$ ${Number(sale.total).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Histórico de Vendas</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .info { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
          .total-row { background: #f0f0f0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Histórico de Vendas</h1>
        <p class="info">Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })} | Total de vendas: ${sales.length}</p>
        
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Pagamento</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows}
            <tr class="total-row">
              <td colspan="4" style="padding: 10px; text-align: right;">TOTAL GERAL:</td>
              <td style="padding: 10px; text-align: right;">R$ ${totalGeral.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast({
      title: "Exportar PDF",
      description: "Use a opção 'Salvar como PDF' na janela de impressão",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Vendas
          </DialogTitle>
          <DialogDescription>
            Vendas realizadas nesta sessão de caixa
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma venda realizada ainda</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3 pr-4">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {sale.cliente_nome || "Cliente não informado"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(sale.created_at), "HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        R$ {Number(sale.total).toFixed(2)}
                      </p>
                      <div className="flex gap-1 justify-end mt-1">
                        {sale.pagamentos.map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {p.forma_pagamento}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                  
                  {expandedSale === sale.id && (
                    <div className="border-t bg-muted/30 p-3">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Itens:</p>
                      <div className="space-y-1">
                        {sale.itens.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>
                              {item.quantidade}x {item.produto_nome}
                            </span>
                            <span className="text-muted-foreground">
                              R$ {(item.quantidade * Number(item.preco_unitario)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between pt-2 gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={loading || sales.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
