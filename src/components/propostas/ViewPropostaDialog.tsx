import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Send, ShoppingCart, Printer, Loader2 } from "lucide-react";
import { Proposta, PropostaItem, PropostaBlock, usePropostas } from "@/hooks/usePropostas";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ViewPropostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta: Proposta;
}

const statusColors: Record<string, string> = {
  rascunho: "bg-gray-500",
  enviada: "bg-blue-500",
  visualizada: "bg-purple-500",
  aprovada: "bg-green-500",
  rejeitada: "bg-red-500",
  convertida: "bg-amber-500",
};

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  convertida: "Convertida em Venda",
};

export function ViewPropostaDialog({
  open,
  onOpenChange,
  proposta,
}: ViewPropostaDialogProps) {
  const { fetchItens } = usePropostas();
  const [itens, setItens] = useState<PropostaItem[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && proposta) {
      loadItens();
    }
  }, [open, proposta]);

  const loadItens = async () => {
    const data = await fetchItens(proposta.id);
    setItens(data);
  };

  const dataValidade = addDays(
    new Date(proposta.created_at),
    proposta.validade_dias
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;

    setGeneratingPdf(true);
    try {
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`proposta-${proposta.numero}.pdf`);

      toast({
        title: "PDF gerado",
        description: "O PDF da proposta foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const renderBlock = (block: PropostaBlock) => {
    const config = block.config || {};

    switch (block.type) {
      case "header":
        return (
          <div 
            key={block.id} 
            className="py-4 px-6 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
              textAlign: config.alignment || "center",
            }}
          >
            {config.logoUrl && (
              <img
                src={config.logoUrl}
                alt="Logo"
                className="max-h-16 mb-3"
                style={{
                  marginLeft: config.alignment === "center" ? "auto" : config.alignment === "right" ? "auto" : "0",
                  marginRight: config.alignment === "center" ? "auto" : config.alignment === "left" ? "auto" : "0",
                  display: "block",
                }}
              />
            )}
            <h1 
              className="text-2xl font-bold"
              style={{ color: config.textColor || "#000000" }}
            >
              {block.content || "Proposta Comercial"}
            </h1>
            <p 
              className="mt-1"
              style={{ color: config.textColor ? `${config.textColor}99` : "#666666" }}
            >
              Proposta Nº {proposta.numero}
            </p>
          </div>
        );

      case "items":
        return (
          <div key={block.id} className="space-y-4">
            <h3 
              className="font-semibold text-lg"
              style={{ color: config.textColor || "#000000" }}
            >
              Itens da Proposta
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead 
                  style={{ 
                    backgroundColor: config.headerBgColor || "#f3f4f6",
                    color: config.headerTextColor || "#000000",
                  }}
                >
                  <tr>
                    <th className="text-left p-3">Descrição</th>
                    <th className="text-center p-3 w-20">Qtd</th>
                    <th className="text-right p-3 w-28">Unitário</th>
                    <th className="text-center p-3 w-20">Desc.</th>
                    <th className="text-right p-3 w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, idx) => (
                    <tr 
                      key={item.id || idx} 
                      className="border-t"
                      style={{ 
                        backgroundColor: config.rowBgColor || "#ffffff",
                        color: config.rowTextColor || "#000000",
                      }}
                    >
                      <td className="p-3">{item.descricao}</td>
                      <td className="text-center p-3">{item.quantidade}</td>
                      <td className="text-right p-3">
                        {item.preco_unitario.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="text-center p-3">
                        {item.desconto_percentual > 0
                          ? `${item.desconto_percentual}%`
                          : "-"}
                      </td>
                      <td className="text-right p-3 font-medium">
                        {item.total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot 
                  className="font-semibold"
                  style={{ 
                    backgroundColor: config.footerBgColor || "#f3f4f6",
                    color: config.footerTextColor || "#000000",
                  }}
                >
                  <tr>
                    <td colSpan={4} className="text-right p-3">Total:</td>
                    <td className="text-right p-3">
                      {proposta.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );

      case "conditions":
        return (
          <div 
            key={block.id} 
            className="space-y-2 p-4 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
            }}
          >
            <h3 
              className="font-semibold text-lg"
              style={{ color: config.textColor || "#000000" }}
            >
              Condições
            </h3>
            <p 
              className="whitespace-pre-wrap"
              style={{ 
                color: config.textColor || "#000000",
                fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
              }}
            >
              {block.content || proposta.condicoes || "-"}
            </p>
          </div>
        );

      case "text":
        return (
          <div 
            key={block.id}
            className="p-4 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
              textAlign: config.alignment || "left",
            }}
          >
            <p 
              className="whitespace-pre-wrap"
              style={{ 
                color: config.textColor || "#000000",
                fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
              }}
            >
              {block.content}
            </p>
          </div>
        );

      case "divider":
        return (
          <Separator 
            key={block.id} 
            style={{ 
              backgroundColor: config.borderColor || "#e5e7eb",
              marginTop: config.padding === "small" ? "0.5rem" : config.padding === "large" ? "1.5rem" : "1rem",
              marginBottom: config.padding === "small" ? "0.5rem" : config.padding === "large" ? "1.5rem" : "1rem",
            }}
          />
        );

      case "footer":
        return (
          <div 
            key={block.id}
            className="p-4 rounded mt-4"
            style={{ 
              backgroundColor: config.backgroundColor || "#f3f4f6",
              color: config.textColor || "#666666",
            }}
          >
            {config.companyName && (
              <p className="font-semibold text-lg">{config.companyName}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm mt-1">
              {config.companyPhone && <span>📞 {config.companyPhone}</span>}
              {config.companyEmail && <span>✉️ {config.companyEmail}</span>}
            </div>
            {config.companyAddress && (
              <p className="text-sm mt-2">📍 {config.companyAddress}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between print:hidden">
          <div>
            <DialogTitle>Proposta #{proposta.numero}</DialogTitle>
            <p className="text-sm text-muted-foreground">{proposta.titulo}</p>
          </div>
          <Badge className={`${statusColors[proposta.status]} text-white`}>
            {statusLabels[proposta.status] || proposta.status}
          </Badge>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div ref={printRef} className="p-6 space-y-6 print:p-0 bg-white">
            {/* Renderizar blocos do layout */}
            {proposta.layout.map((block) => renderBlock(block))}

            {/* Informações do cliente */}
            {proposta.cliente_nome && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold text-foreground">Cliente</h3>
                <div className="text-sm space-y-1 text-foreground">
                  <p><strong>Nome:</strong> {proposta.cliente_nome}</p>
                  {proposta.cliente_email && (
                    <p><strong>Email:</strong> {proposta.cliente_email}</p>
                  )}
                  {proposta.cliente_telefone && (
                    <p><strong>Telefone:</strong> {proposta.cliente_telefone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Rodapé com validade */}
            <div className="pt-4 border-t text-sm text-muted-foreground">
              <p>
                <strong>Data de Emissão:</strong>{" "}
                {format(new Date(proposta.created_at), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
              <p>
                <strong>Válida até:</strong>{" "}
                {format(dataValidade, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={generatingPdf}>
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {generatingPdf ? "Gerando..." : "Baixar PDF"}
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Enviar por Email
          </Button>
          {proposta.status === "aprovada" && (
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Converter em Venda
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
