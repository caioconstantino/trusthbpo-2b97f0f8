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
import { Download, Send, ShoppingCart, Printer, Loader2, CheckCircle2, Star } from "lucide-react";
import { Proposta, PropostaItem, PropostaBlock, OfertaTier, PrazoItem, AssinaturaParty, usePropostas } from "@/hooks/usePropostas";
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
      const A4_WIDTH_PX = 794; // A4 at 96dpi

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      // Get all direct children of the print container
      const children = Array.from(element.children) as HTMLElement[];
      
      let currentY = margin; // current Y position on the current page
      let pageNum = 0;

      for (const child of children) {
        // Render each block to its own canvas
        const blockCanvas = await html2canvas(child, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: A4_WIDTH_PX,
        });

        const blockImgWidth = blockCanvas.width;
        const blockImgHeight = blockCanvas.height;
        const ratio = usableWidth / blockImgWidth;
        const blockHeightMm = blockImgHeight * ratio;

        // If this block doesn't fit on the current page, start a new page
        // (unless we're at the very top of a page already)
        if (currentY + blockHeightMm > pdfHeight - margin && currentY > margin + 1) {
          pdf.addPage();
          pageNum++;
          currentY = margin;
        }

        // If a single block is taller than one page, slice it
        if (blockHeightMm > usableHeight) {
          let slicePos = 0;
          while (slicePos < blockImgHeight) {
            if (currentY > margin + 1) {
              pdf.addPage();
              pageNum++;
              currentY = margin;
            }
            const sliceH = Math.min(usableHeight / ratio, blockImgHeight - slicePos);
            const destH = sliceH * ratio;

            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = blockImgWidth;
            sliceCanvas.height = sliceH;
            const ctx = sliceCanvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(blockCanvas, 0, slicePos, blockImgWidth, sliceH, 0, 0, blockImgWidth, sliceH);
            }
            pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, currentY, usableWidth, destH);
            slicePos += sliceH;
            currentY += destH;
          }
        } else {
          const imgData = blockCanvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", margin, currentY, usableWidth, blockHeightMm);
          currentY += blockHeightMm;
        }
      }

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

      case "conditions": {
        const condContent = block.content || proposta.condicoes || "-";
        const condIsHtml = condContent.includes("<");
        return (
          <div 
            key={block.id} 
            className="space-y-2 p-4 rounded"
            style={{ backgroundColor: config.backgroundColor || "transparent" }}
          >
            <h3 className="font-semibold text-lg" style={{ color: config.textColor || "#000000" }}>
              Condições
            </h3>
            {condIsHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: condContent }}
                style={{ 
                  color: config.textColor || "#000000",
                  fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
                }}
                className="[&_p]:my-1"
              />
            ) : (
              <p className="whitespace-pre-wrap" style={{ 
                color: config.textColor || "#000000",
                fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
              }}>
                {condContent}
              </p>
            )}
          </div>
        );
      }

      case "text": {
        const textContent = block.content || "";
        const textIsHtml = textContent.includes("<");
        return (
          <div 
            key={block.id}
            className="p-4 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
              textAlign: config.alignment || "left",
            }}
          >
            {textIsHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: textContent }}
                style={{ 
                  color: config.textColor || "#000000",
                  fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
                }}
                className="[&_p]:my-1"
              />
            ) : (
              <p className="whitespace-pre-wrap" style={{ 
                color: config.textColor || "#000000",
                fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
              }}>
                {textContent}
              </p>
            )}
          </div>
        );
      }

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

      case "cliente": {
        const campos = config.camposCliente || ["nome", "email", "telefone"];
        const fieldLabels: Record<string, string> = { nome: "Nome", email: "E-mail", telefone: "Telefone", documento: "Documento", endereco: "Endereço", empresa: "Empresa" };
        const fieldValues: Record<string, string> = {
          nome: proposta.cliente_nome || "",
          email: proposta.cliente_email || "",
          telefone: proposta.cliente_telefone || "",
          documento: "", endereco: "", empresa: "",
        };
        return (
          <div key={block.id} className="p-4 rounded" style={{ backgroundColor: config.backgroundColor || "#f8fafc" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: config.textColor || "#334155", opacity: 0.6 }}>Destinatário</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {campos.map((c: string) => (
                <div key={c} className="text-sm" style={{ color: config.textColor || "#334155" }}>
                  <span className="font-medium opacity-70">{fieldLabels[c] || c}: </span>
                  <span>{fieldValues[c] || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "oferta": {
        const tiers: OfertaTier[] = config.ofertas || [];
        return (
          <div key={block.id} className={`grid gap-4 ${tiers.length === 1 ? "grid-cols-1" : tiers.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className="rounded-lg border p-5 flex flex-col gap-2 relative"
                style={tier.destaque ? { backgroundColor: tier.corDestaque || "#1e3a5f", borderColor: "transparent" } : { backgroundColor: "#ffffff" }}
              >
                {tier.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> RECOMENDADO
                    </span>
                  </div>
                )}
                <p className="text-base font-bold" style={{ color: tier.destaque ? "#ffffff" : "#111827" }}>{tier.nome}</p>
                <p className="text-2xl font-black" style={{ color: tier.destaque ? "#ffffff" : "#1e3a5f" }}>{tier.preco}</p>
                {tier.descricao && <p className="text-sm" style={{ color: tier.destaque ? "#ffffffaa" : "#6b7280" }}>{tier.descricao}</p>}
                <ul className="space-y-1 mt-2">
                  {(tier.features || []).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm" style={{ color: tier.destaque ? "#ffffffcc" : "#374151" }}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: tier.destaque ? "#ffffff" : "#22c55e" }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      }

      case "beneficios": {
        const items = (block.content || "").split("\n").filter(Boolean);
        const cols = parseInt(config.colunasBeneficios || "2");
        const iconType = config.iconeBeneficios || "check";
        const IconComp = iconType === "star" ? Star : CheckCircle2;
        return (
          <div key={block.id} className="p-4 rounded" style={{ backgroundColor: config.backgroundColor || "#ffffff" }}>
            <div className={`grid gap-3 ${cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: config.textColor || "#374151" }}>
                  <IconComp className="h-4 w-4 shrink-0 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "prazo": {
        const prazos: PrazoItem[] = config.itensPrazo || [];
        return (
          <div key={block.id} className="p-4 rounded" style={{ backgroundColor: config.backgroundColor || "#ffffff" }}>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5" style={{ backgroundColor: (config.textColor || "#1e3a5f") + "30" }} />
              <div className="space-y-4">
                {prazos.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 pl-10 relative">
                    <div className="absolute left-0 w-7 h-7 rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: config.textColor || "#1e3a5f" }}>
                      <span className="text-xs font-bold" style={{ color: config.textColor || "#1e3a5f" }}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: config.textColor || "#111827" }}>{item.label}</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: (config.textColor || "#1e3a5f") + "15", color: config.textColor || "#1e3a5f" }}>
                      {item.data}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "imagem":
        return (
          <div key={block.id} className="rounded overflow-hidden" style={{ textAlign: (config.alignment as "left" | "center" | "right") || "center" }}>
            {config.imageUrl ? (
              <div>
                <img
                  src={config.imageUrl}
                  alt={config.imageCaption || "Imagem"}
                  className="inline-block rounded"
                  style={{ width: config.imageWidth === "75" ? "75%" : config.imageWidth === "50" ? "50%" : "100%", objectFit: "cover" }}
                />
                {config.imageCaption && <p className="text-sm text-gray-500 mt-1 italic">{config.imageCaption}</p>}
              </div>
            ) : null}
          </div>
        );

      case "assinatura": {
        const parties: AssinaturaParty[] = config.partesAssinatura || [{ label: "Cliente" }, { label: "Empresa" }];
        return (
          <div key={block.id} className="p-6 rounded" style={{ backgroundColor: config.backgroundColor || "#ffffff" }}>
            <div className={`grid gap-12 ${parties.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {parties.map((party, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-full border-b-2 border-gray-400 h-12" />
                  <p className="text-sm font-medium text-gray-600">{party.label}</p>
                  <p className="text-xs text-gray-400">Assinatura e data</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

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
