import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import {
  GripVertical,
  Trash2,
  Plus,
  Type,
  List,
  FileText,
  Minus,
  Save,
  Settings,
  FileSignature,
  User,
  Tag,
  Image,
  PenLine,
  CheckCircle2,
  Clock,
  Palette,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { usePropostas, Proposta, PropostaBlock, PropostaItem, BlockConfig } from "@/hooks/usePropostas";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";
import { toast } from "@/hooks/use-toast";
import { BlockConfigPanel } from "./BlockConfigPanel";
import { cn } from "@/lib/utils";

interface Produto {
  id: number;
  nome: string;
  preco_venda: number;
}

interface PropostaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta: Proposta;
  onSaved: () => void;
}

const BLOCK_TYPES = [
  { type: "header" as const, Icon: Type, label: "Cabeçalho", description: "Título e logo da proposta", group: "Layout" },
  { type: "items" as const, Icon: List, label: "Itens", description: "Tabela de produtos/serviços", group: "Layout" },
  { type: "divider" as const, Icon: Minus, label: "Divisor", description: "Linha separadora", group: "Layout" },
  { type: "footer" as const, Icon: FileSignature, label: "Rodapé", description: "Dados da empresa", group: "Layout" },
  { type: "text" as const, Icon: Type, label: "Texto livre", description: "Parágrafo personalizado", group: "Layout" },
  { type: "cliente" as const, Icon: User, label: "Dados do Cliente", description: "Campos do destinatário", group: "Conteúdo" },
  { type: "oferta" as const, Icon: Tag, label: "Oferta / Preços", description: "Cards de planos ou opções", group: "Conteúdo" },
  { type: "beneficios" as const, Icon: CheckCircle2, label: "Benefícios", description: "Lista de vantagens", group: "Conteúdo" },
  { type: "prazo" as const, Icon: Clock, label: "Prazo / Timeline", description: "Cronograma de entregas", group: "Conteúdo" },
  { type: "imagem" as const, Icon: Image, label: "Imagem", description: "Banner ou foto", group: "Mídia" },
  { type: "assinatura" as const, Icon: PenLine, label: "Assinatura", description: "Campos de assinatura", group: "Finalização" },
  { type: "conditions" as const, Icon: FileText, label: "Condições", description: "Texto de condições gerais", group: "Finalização" },
];

const BLOCK_GROUPS = ["Layout", "Conteúdo", "Mídia", "Finalização"];

const blockTypeIcons: Record<string, React.ElementType> = {};
const blockTypeLabels: Record<string, string> = {};
BLOCK_TYPES.forEach(b => { blockTypeIcons[b.type] = b.Icon; blockTypeLabels[b.type] = b.label; });

export function PropostaEditorDialog({
  open,
  onOpenChange,
  proposta,
  onSaved,
}: PropostaEditorDialogProps) {
  const { updateProposta, fetchItens, saveItens } = usePropostas();
  const { unidadeAtiva } = useUnidadeAtiva();
  const dominio = localStorage.getItem("user_dominio") || "";

  const [layout, setLayout] = useState<PropostaBlock[]>([]);
  const [itens, setItens] = useState<Partial<PropostaItem>[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [titulo, setTitulo] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"layout" | "itens" | "config">("layout");

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newLayout = [...layout];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setLayout(newLayout);
    setEditingBlockIndex(targetIndex);
  };

  useEffect(() => {
    if (open && proposta) {
      setLayout(proposta.layout || []);
      setTitulo(proposta.titulo);
      setCondicoes(proposta.condicoes || "");
      setStatus(proposta.status);
      loadItens();
      loadProdutos();
    }
  }, [open, proposta]);

  const loadItens = async () => {
    const data = await fetchItens(proposta.id);
    setItens(
      data.length > 0
        ? data.map((item) => ({
            ...item,
            produto_id: item.produto_id,
          }))
        : [{ descricao: "", quantidade: 1, preco_unitario: 0, desconto_percentual: 0, total: 0 }]
    );
  };

  const loadProdutos = async () => {
    let query = supabase
      .from("tb_produtos")
      .select("id, nome, preco_venda")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (unidadeAtiva?.id) {
      query = query.eq("unidade_id", unidadeAtiva.id);
    }

    const { data } = await query;
    setProdutos(data || []);
  };

  const addBlock = (type: PropostaBlock["type"]) => {
    const defaultConfig: BlockConfig = {
      alignment: "center",
      backgroundColor: "#ffffff",
      textColor: "#000000",
    };

    const newBlock: PropostaBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: type === "header" ? "Proposta Comercial" : type === "conditions" ? "Condições de pagamento e entrega a combinar." : "",
      config: defaultConfig,
    };
    setLayout([...layout, newBlock]);
  };

  const removeBlock = (index: number) => {
    setLayout(layout.filter((_, i) => i !== index));
    if (editingBlockIndex === index) {
      setEditingBlockIndex(null);
    }
  };

  const updateBlockContent = (index: number, content: string) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], content };
    setLayout(newLayout);
  };

  const updateBlockConfig = (index: number, config: BlockConfig) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], config };
    setLayout(newLayout);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLayout = [...layout];
    const [draggedItem] = newLayout.splice(draggedIndex, 1);
    newLayout.splice(index, 0, draggedItem);
    setLayout(newLayout);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Gerenciamento de itens
  const addItem = () => {
    setItens([
      ...itens,
      { descricao: "", quantidade: 1, preco_unitario: 0, desconto_percentual: 0, total: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };

    // Recalcular total
    if (field === "quantidade" || field === "preco_unitario" || field === "desconto_percentual") {
      const qtd = Number(newItens[index].quantidade) || 0;
      const preco = Number(newItens[index].preco_unitario) || 0;
      const desconto = Number(newItens[index].desconto_percentual) || 0;
      const subtotal = qtd * preco;
      newItens[index].total = subtotal - (subtotal * desconto) / 100;
    }

    setItens(newItens);
  };

  const selectProduto = (index: number, produtoId: string) => {
    const produto = produtos.find((p) => p.id.toString() === produtoId);
    if (produto) {
      const newItens = [...itens];
      newItens[index] = {
        ...newItens[index],
        produto_id: produto.id,
        descricao: produto.nome,
        preco_unitario: produto.preco_venda,
        total: (newItens[index].quantidade || 1) * produto.preco_venda,
      };
      setItens(newItens);
    }
  };

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + (item.total || 0), 0);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Atualizar proposta
      await updateProposta(proposta.id, {
        titulo,
        layout,
        condicoes,
        status,
        total: calcularTotal(),
      });

      // Salvar itens
      await saveItens(proposta.id, itens);

      toast({
        title: "Sucesso",
        description: "Proposta salva com sucesso",
      });

      onSaved();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBlockPreview = (block: PropostaBlock) => {
    const config = block.config || {};
    
    switch (block.type) {
      case "header":
        return (
          <div 
            className="p-3 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
              textAlign: config.alignment || "center",
            }}
          >
            {config.logoUrl && (
              <img 
                src={config.logoUrl} 
                alt="Logo" 
                className="max-h-12 mb-2"
                style={{ 
                  marginLeft: config.alignment === "center" ? "auto" : config.alignment === "right" ? "auto" : "0",
                  marginRight: config.alignment === "center" ? "auto" : config.alignment === "left" ? "auto" : "0",
                  display: "block",
                }}
              />
            )}
            <p 
              className="font-semibold"
              style={{ color: config.textColor || "inherit" }}
            >
              {block.content || "Cabeçalho"}
            </p>
          </div>
        );

      case "items":
        return (
          <div className="text-sm">
            <div 
              className="p-2 rounded-t font-medium"
              style={{ 
                backgroundColor: config.headerBgColor || "#f3f4f6",
                color: config.headerTextColor || "inherit",
              }}
            >
              Tabela de Itens
            </div>
            <div 
              className="p-2 border-x"
              style={{ 
                backgroundColor: config.rowBgColor || "#ffffff",
                color: config.rowTextColor || "inherit",
              }}
            >
              {itens.length} item(ns)
            </div>
            <div 
              className="p-2 rounded-b font-medium"
              style={{ 
                backgroundColor: config.footerBgColor || "#f3f4f6",
                color: config.footerTextColor || "inherit",
              }}
            >
              Total: {calcularTotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        );

      case "conditions":
        return (
          <div 
            className="p-2 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
              color: config.textColor || "inherit",
              fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
            }}
          >
            <p className="text-sm line-clamp-2">{block.content || "Condições..."}</p>
          </div>
        );

      case "text":
        return (
          <div 
            className="p-2 rounded"
            style={{ 
              backgroundColor: config.backgroundColor || "transparent",
              color: config.textColor || "inherit",
              textAlign: config.alignment || "left",
              fontSize: config.fontSize === "small" ? "0.875rem" : config.fontSize === "large" ? "1.125rem" : "1rem",
            }}
          >
            <p className="text-sm line-clamp-2">{block.content || "Texto..."}</p>
          </div>
        );

      case "divider":
        return (
          <hr 
            className="my-2"
            style={{ 
              borderColor: config.borderColor || "#e5e7eb",
              marginTop: config.padding === "small" ? "0.5rem" : config.padding === "large" ? "1.5rem" : "1rem",
              marginBottom: config.padding === "small" ? "0.5rem" : config.padding === "large" ? "1.5rem" : "1rem",
            }}
          />
        );

      case "footer":
        return (
          <div 
            className="p-2 rounded text-sm"
            style={{ 
              backgroundColor: config.backgroundColor || "#f3f4f6",
              color: config.textColor || "#666666",
            }}
          >
            {config.companyName && <p className="font-medium">{config.companyName}</p>}
            <div className="flex gap-4 text-xs">
              {config.companyPhone && <span>{config.companyPhone}</span>}
              {config.companyEmail && <span>{config.companyEmail}</span>}
            </div>
            {config.companyAddress && <p className="text-xs mt-1">{config.companyAddress}</p>}
            {!config.companyName && !config.companyPhone && !config.companyEmail && (
              <p className="text-muted-foreground">Clique em configurar para adicionar informações</p>
            )}
          </div>
        );

      case "cliente":
        return (
          <div className="p-2 rounded text-sm" style={{ backgroundColor: config.backgroundColor || "transparent", color: config.textColor || "inherit" }}>
            <p className="font-medium mb-1">Dados do Cliente</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {(config.camposCliente || ["nome", "email", "telefone"]).map((c) => (
                <span key={c}>• {c}</span>
              ))}
            </div>
          </div>
        );

      case "oferta":
        return (
          <div className="p-2 rounded text-sm">
            <div className="flex gap-2">
              {(config.ofertas || [{ nome: "Plano", preco: "0" }]).map((o, i) => (
                <div key={i} className="flex-1 border rounded p-2 text-center" style={{ borderColor: o.destaque ? (o.corDestaque || "hsl(var(--primary))") : undefined }}>
                  <p className="font-medium text-xs">{o.nome}</p>
                  <p className="text-xs">R$ {o.preco}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "imagem":
        return (
          <div className="p-2 rounded text-center">
            {config.imageUrl ? (
              <img src={config.imageUrl} alt="" className="max-h-16 mx-auto rounded" style={{ maxWidth: config.imageWidth || "100%" }} />
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma imagem selecionada</p>
            )}
          </div>
        );

      case "assinatura":
        return (
          <div className="p-2 rounded text-sm">
            <div className="flex gap-4 justify-center">
              {(config.partesAssinatura || [{ label: "Contratante" }, { label: "Contratado" }]).map((p, i) => (
                <div key={i} className="text-center">
                  <div className="border-b border-foreground/30 w-24 mb-1" />
                  <p className="text-xs">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "beneficios":
        return (
          <div className="p-2 rounded text-sm">
            <p className="font-medium mb-1">Benefícios</p>
            <div className="text-xs text-muted-foreground">
              <span>• Lista de benefícios configuráveis</span>
            </div>
          </div>
        );

      case "prazo":
        return (
          <div className="p-2 rounded text-sm">
            <p className="font-medium mb-1">Prazo / Timeline</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {(config.itensPrazo || [{ label: "Etapa 1", data: "" }]).map((p, i) => (
                <span key={i} className="bg-muted px-2 py-1 rounded">{p.label}</span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[1280px] h-[93vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Editar Proposta #{proposta.numero}</DialogTitle>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Proposta #{proposta.numero}</span>
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="layout" className="text-xs px-3 h-7">Layout</TabsTrigger>
                <TabsTrigger value="itens" className="text-xs px-3 h-7">Itens</TabsTrigger>
                <TabsTrigger value="config" className="text-xs px-3 h-7">Configurações</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {loading ? "Salvando..." : "Salvar Proposta"}
            </Button>
          </div>
        </div>

        {/* Layout tab */}
        {activeTab === "layout" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left palette */}
            <div className="w-44 border-r bg-muted/20 flex flex-col shrink-0">
              <div className="px-3 py-2.5 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elementos</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {BLOCK_GROUPS.map(group => (
                    <div key={group} className="mb-3">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-1.5 mb-1">{group}</p>
                      <div className="space-y-0.5">
                        {BLOCK_TYPES.filter(b => b.group === group).map(({ type, Icon, label, description }) => (
                          <TooltipProvider key={type} delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => addBlock(type)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-muted transition-colors group">
                                  <div className="w-6 h-6 rounded bg-background border flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
                                    <Icon className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <span className="text-xs leading-tight">{label}</span>
                                  <Plus className="h-2.5 w-2.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">{description}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-muted/40" onClick={() => setEditingBlockIndex(null)}>
              <div className="min-h-full flex justify-center py-8 px-12">
                <div className="w-full max-w-2xl bg-background shadow-xl rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                  {layout.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                      <Palette className="h-8 w-8 opacity-30" />
                      <p className="text-sm">Clique nos elementos à esquerda para começar</p>
                    </div>
                  ) : (
                    <div className="p-8 space-y-3">
                      {layout.map((block, index) => {
                        const Icon = blockTypeIcons[block.type];
                        const isSelected = editingBlockIndex === index;
                        return (
                          <div
                            key={block.id}
                            className={cn(
                              "relative pl-8 group cursor-pointer rounded-md transition-all",
                              isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-muted-foreground/30"
                            )}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setEditingBlockIndex(isSelected ? null : index)}
                          >
                            {/* Drag handle + actions */}
                            <div className="absolute left-0 top-0 bottom-0 w-7 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="absolute -right-1 top-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {index > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); moveBlock(index, "up"); }} className="w-5 h-5 rounded bg-background border flex items-center justify-center hover:bg-muted">
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                              )}
                              {index < layout.length - 1 && (
                                <button onClick={(e) => { e.stopPropagation(); moveBlock(index, "down"); }} className="w-5 h-5 rounded bg-background border flex items-center justify-center hover:bg-muted">
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); removeBlock(index); }} className="w-5 h-5 rounded bg-background border flex items-center justify-center hover:bg-destructive/10 text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Block label */}
                            <div className="flex items-center gap-2 mb-1 pt-2">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">{blockTypeLabels[block.type]}</span>
                            </div>
                            {/* Block preview */}
                            {getBlockPreview(block)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right properties panel */}
            <div className={cn("border-l bg-background flex flex-col transition-all duration-200 shrink-0 overflow-hidden", editingBlockIndex !== null && layout[editingBlockIndex] ? "w-64" : "w-0")}>
              {editingBlockIndex !== null && layout[editingBlockIndex] && (
                <BlockConfigPanel
                  blockType={layout[editingBlockIndex].type}
                  config={layout[editingBlockIndex].config || {}}
                  content={layout[editingBlockIndex].content}
                  onConfigChange={(config) => updateBlockConfig(editingBlockIndex, config)}
                  onContentChange={(content) => updateBlockContent(editingBlockIndex, content)}
                  onClose={() => setEditingBlockIndex(null)}
                />
              )}
            </div>
          </div>
        )}

        {/* Itens tab */}
        {activeTab === "itens" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-4 max-w-4xl mx-auto">
              {itens.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">Produto</Label>
                        <Select
                          value={item.produto_id?.toString() || ""}
                          onValueChange={(v) => selectProduto(index, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos
                              .filter((p) => p.id != null && p.id.toString() !== "")
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={item.descricao || ""}
                          onChange={(e) => updateItem(index, "descricao", e.target.value)}
                          placeholder="Descrição do item"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantidade || ""}
                          onChange={(e) => updateItem(index, "quantidade", parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Preço</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.preco_unitario || ""}
                          onChange={(e) => updateItem(index, "preco_unitario", parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Desc %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.desconto_percentual || ""}
                          onChange={(e) => updateItem(index, "desconto_percentual", parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Total</Label>
                        <Input
                          value={(item.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          disabled
                        />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={itens.length === 1}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
              <Card className="bg-muted">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="font-semibold">Total da Proposta</span>
                  <span className="text-2xl font-bold">
                    {calcularTotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Config tab */}
        {activeTab === "config" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-4 max-w-lg mx-auto">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="visualizada">Visualizada</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                    <SelectItem value="convertida">Convertida em Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condições Gerais</Label>
                <Textarea
                  value={condicoes}
                  onChange={(e) => setCondicoes(e.target.value)}
                  placeholder="Condições de pagamento, prazo de entrega, garantias..."
                  rows={5}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
