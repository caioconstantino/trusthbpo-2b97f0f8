import { useState, useEffect, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
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
import {
  GripVertical,
  Trash2,
  Type,
  List,
  FileText,
  Minus,
  Save,
  FileSignature,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  Palette,
  Settings2,
} from "lucide-react";
import { usePropostas, PropostaModelo, PropostaBlock, BlockConfig } from "@/hooks/usePropostas";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ModeloEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: PropostaModelo | null;
  onSaved: () => void;
}

const BLOCK_TYPES = [
  { type: "header" as const, Icon: Type, label: "Cabeçalho", description: "Título e logo" },
  { type: "items" as const, Icon: List, label: "Itens", description: "Tabela de produtos" },
  { type: "conditions" as const, Icon: FileText, label: "Condições", description: "Texto de condições" },
  { type: "text" as const, Icon: Type, label: "Texto livre", description: "Parágrafo personalizado" },
  { type: "divider" as const, Icon: Minus, label: "Divisor", description: "Linha separadora" },
  { type: "footer" as const, Icon: FileSignature, label: "Rodapé", description: "Dados da empresa" },
];

const defaultLayout: PropostaBlock[] = [
  { id: "header-1", type: "header", content: "Proposta Comercial", config: { alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" } },
  { id: "items-1", type: "items", config: { headerBgColor: "#f3f4f6", headerTextColor: "#111827", rowBgColor: "#ffffff", rowTextColor: "#374151", footerBgColor: "#f9fafb", footerTextColor: "#111827" } },
  { id: "conditions-1", type: "conditions", content: "Condições de pagamento e entrega a combinar.", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
];

// ─── Visual preview of each block ───────────────────────────────────────────

function BlockPreview({ block, selected, onClick, onMoveUp, onMoveDown, onDelete, isFirst, isLast }: {
  block: PropostaBlock;
  selected: boolean;
  onClick: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const cfg = block.config || {};

  const renderContent = () => {
    switch (block.type) {
      case "header":
        return (
          <div
            className="w-full rounded-md overflow-hidden"
            style={{ backgroundColor: cfg.backgroundColor || "#1e3a5f", padding: "24px 32px" }}
          >
            <div className={cn("flex items-center gap-4", {
              "justify-start": cfg.alignment === "left",
              "justify-center": cfg.alignment === "center" || !cfg.alignment,
              "justify-end": cfg.alignment === "right",
            })}>
              {cfg.logoUrl && (
                <img src={cfg.logoUrl} alt="Logo" className="h-12 object-contain" />
              )}
              <span
                className="text-xl font-bold"
                style={{ color: cfg.textColor || "#ffffff" }}
              >
                {block.content || "Proposta Comercial"}
              </span>
            </div>
          </div>
        );

      case "items":
        return (
          <div className="w-full rounded-md overflow-hidden border border-border/30">
            <div
              className="grid grid-cols-4 px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: cfg.headerBgColor || "#f3f4f6", color: cfg.headerTextColor || "#111827" }}
            >
              <span>Descrição</span>
              <span className="text-center">Qtd</span>
              <span className="text-center">Preço Unit.</span>
              <span className="text-right">Total</span>
            </div>
            {[1, 2].map(i => (
              <div
                key={i}
                className="grid grid-cols-4 px-4 py-2 text-xs border-t border-border/20"
                style={{ backgroundColor: cfg.rowBgColor || "#ffffff", color: cfg.rowTextColor || "#374151" }}
              >
                <span>Produto {i}</span>
                <span className="text-center">1</span>
                <span className="text-center">R$ 0,00</span>
                <span className="text-right">R$ 0,00</span>
              </div>
            ))}
            <div
              className="grid grid-cols-4 px-4 py-2 text-xs font-semibold border-t border-border/30"
              style={{ backgroundColor: cfg.footerBgColor || "#f9fafb", color: cfg.footerTextColor || "#111827" }}
            >
              <span className="col-span-3 text-right">Total</span>
              <span className="text-right">R$ 0,00</span>
            </div>
          </div>
        );

      case "divider":
        return (
          <div className="w-full py-2">
            <hr style={{ borderColor: cfg.borderColor || "#e5e7eb", borderTopWidth: 2 }} />
          </div>
        );

      case "footer":
        return (
          <div
            className="w-full rounded-md px-6 py-4"
            style={{ backgroundColor: cfg.backgroundColor || "#f3f4f6" }}
          >
            <div className="flex justify-between items-end text-xs" style={{ color: cfg.textColor || "#666666" }}>
              <div className="space-y-0.5">
                <p className="font-semibold">{cfg.companyName || "Nome da Empresa"}</p>
                {cfg.companyPhone && <p>{cfg.companyPhone}</p>}
                {cfg.companyEmail && <p>{cfg.companyEmail}</p>}
              </div>
              {cfg.companyAddress && <p className="text-right max-w-[200px]">{cfg.companyAddress}</p>}
            </div>
          </div>
        );

      case "conditions":
      case "text":
      default:
        return (
          <div
            className="w-full rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: cfg.backgroundColor || "#ffffff",
              color: cfg.textColor || "#374151",
              fontSize: cfg.fontSize === "small" ? "11px" : cfg.fontSize === "large" ? "15px" : "13px",
              textAlign: (cfg.alignment as "left" | "center" | "right") || "left",
            }}
          >
            {block.content || (block.type === "conditions" ? "Condições de pagamento e entrega..." : "Texto do bloco...")}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border-2 cursor-pointer transition-all duration-150",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-muted-foreground/30"
      )}
      onClick={onClick}
    >
      {/* Drag handle & controls — visible on hover/selected */}
      <div className={cn(
        "absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        selected && "opacity-100"
      )}>
        <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <GripVertical className="h-4 w-4 text-muted-foreground/50 mx-auto" />
        <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={cn(
          "absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10",
          selected && "opacity-100"
        )}
      >
        <X className="h-3 w-3" />
      </button>

      {/* Block type label */}
      <div className={cn(
        "absolute top-1 right-6 text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
        selected ? "bg-primary text-primary-foreground opacity-100" : "bg-muted text-muted-foreground"
      )}>
        {BLOCK_TYPES.find(b => b.type === block.type)?.label}
      </div>

      <div className="p-1">{renderContent()}</div>
    </div>
  );
}

// ─── Right panel: properties for selected block ──────────────────────────────

function PropertiesPanel({ block, index, onConfigChange, onContentChange }: {
  block: PropostaBlock;
  index: number;
  onConfigChange: (config: BlockConfig) => void;
  onContentChange: (content: string) => void;
}) {
  const cfg = block.config || {};
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof BlockConfig, value: string | boolean) =>
    onConfigChange({ ...cfg, [key]: value });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: "Selecione uma imagem", variant: "destructive" });
    if (file.size > 2 * 1024 * 1024) return toast({ title: "Máximo 2MB", variant: "destructive" });

    setUploading(true);
    try {
      const dominio = localStorage.getItem("user_dominio") || "default";
      const fileName = `${dominio}/propostas-logo-${Date.now()}.${file.name.split(".").pop()}`;
      const { data, error } = await supabase.storage.from("produtos").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("produtos").getPublicUrl(data.path);
      update("logoUrl", pub.publicUrl);
      toast({ title: "Logo enviado!" });
    } catch {
      toast({ title: "Erro ao enviar logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const ColorRow = ({ label, configKey, defaultValue }: { label: string; configKey: keyof BlockConfig; defaultValue: string }) => (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground shrink-0">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={(cfg[configKey] as string) || defaultValue}
          onChange={e => update(configKey, e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border border-border p-0.5"
        />
        <Input
          value={(cfg[configKey] as string) || defaultValue}
          onChange={e => update(configKey, e.target.value)}
          className="h-7 text-xs w-24"
        />
      </div>
    </div>
  );

  const AlignButtons = () => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map(align => {
        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
        return (
          <button
            key={align}
            onClick={() => update("alignment", align)}
            className={cn(
              "p-1.5 rounded border transition-colors",
              cfg.alignment === align || (!cfg.alignment && align === "left")
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-0 h-full">
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            {BLOCK_TYPES.find(b => b.type === block.type)?.label}
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">

          {/* HEADER */}
          {block.type === "header" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input
                  value={block.content || ""}
                  onChange={e => onContentChange(e.target.value)}
                  placeholder="Proposta Comercial"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Alinhamento</Label>
                <AlignButtons />
              </div>
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Logo</p>
              {cfg.logoUrl ? (
                <div className="relative inline-block">
                  <img src={cfg.logoUrl} alt="Logo" className="max-h-16 rounded border" />
                  <button onClick={() => update("logoUrl", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    {uploading ? "Enviando..." : "Enviar Logo"}
                  </Button>
                </>
              )}
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cores</p>
              <ColorRow label="Fundo" configKey="backgroundColor" defaultValue="#1e3a5f" />
              <ColorRow label="Texto" configKey="textColor" defaultValue="#ffffff" />
            </section>
          </>}

          {/* ITEMS */}
          {block.type === "items" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cabeçalho da Tabela</p>
              <ColorRow label="Fundo" configKey="headerBgColor" defaultValue="#f3f4f6" />
              <ColorRow label="Texto" configKey="headerTextColor" defaultValue="#111827" />
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Linhas</p>
              <ColorRow label="Fundo" configKey="rowBgColor" defaultValue="#ffffff" />
              <ColorRow label="Texto" configKey="rowTextColor" defaultValue="#374151" />
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rodapé da Tabela</p>
              <ColorRow label="Fundo" configKey="footerBgColor" defaultValue="#f9fafb" />
              <ColorRow label="Texto" configKey="footerTextColor" defaultValue="#111827" />
            </section>
          </>}

          {/* CONDITIONS / TEXT */}
          {(block.type === "conditions" || block.type === "text") && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</p>
              <Textarea
                value={block.content || ""}
                onChange={e => onContentChange(e.target.value)}
                rows={5}
                placeholder={block.type === "conditions" ? "Condições de pagamento..." : "Digite o texto..."}
                className="text-sm resize-none"
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Alinhamento</Label>
                <AlignButtons />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tamanho da Fonte</Label>
                <Select value={cfg.fontSize || "normal"} onValueChange={v => update("fontSize", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cores</p>
              <ColorRow label="Fundo" configKey="backgroundColor" defaultValue="#ffffff" />
              <ColorRow label="Texto" configKey="textColor" defaultValue="#374151" />
            </section>
          </>}

          {/* DIVIDER */}
          {block.type === "divider" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estilo</p>
              <ColorRow label="Cor da linha" configKey="borderColor" defaultValue="#e5e7eb" />
              <div className="space-y-1.5">
                <Label className="text-xs">Espaçamento</Label>
                <Select value={cfg.padding || "normal"} onValueChange={v => update("padding", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          </>}

          {/* FOOTER */}
          {block.type === "footer" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados da Empresa</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={cfg.companyName || ""} onChange={e => update("companyName", e.target.value)} placeholder="Nome da empresa" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={cfg.companyPhone || ""} onChange={e => update("companyPhone", e.target.value)} placeholder="(00) 00000-0000" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={cfg.companyEmail || ""} onChange={e => update("companyEmail", e.target.value)} placeholder="contato@empresa.com" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Endereço</Label>
                <Textarea value={cfg.companyAddress || ""} onChange={e => update("companyAddress", e.target.value)} placeholder="Endereço completo" rows={2} className="text-sm resize-none" />
              </div>
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cores</p>
              <ColorRow label="Fundo" configKey="backgroundColor" defaultValue="#f3f4f6" />
              <ColorRow label="Texto" configKey="textColor" defaultValue="#666666" />
            </section>
          </>}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export function ModeloEditorDialog({ open, onOpenChange, modelo, onSaved }: ModeloEditorDialogProps) {
  const { createModelo, updateModelo } = usePropostas();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [layout, setLayout] = useState<PropostaBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setNome(modelo?.nome || "");
      setDescricao(modelo?.descricao || "");
      setLayout(modelo ? (modelo.layout || []) : defaultLayout);
      setSelectedIndex(null);
    }
  }, [open, modelo]);

  const addBlock = (type: PropostaBlock["type"]) => {
    const defaults: Record<string, Partial<PropostaBlock>> = {
      header: { content: "Novo Cabeçalho", config: { alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" } },
      items: { config: { headerBgColor: "#f3f4f6", headerTextColor: "#111827", rowBgColor: "#ffffff", rowTextColor: "#374151" } },
      conditions: { content: "Condições de pagamento e entrega a combinar.", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
      text: { content: "Digite seu texto aqui...", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
      divider: { config: { borderColor: "#e5e7eb", padding: "normal" } },
      footer: { config: { backgroundColor: "#f3f4f6", textColor: "#666666" } },
    };
    const newBlock: PropostaBlock = { id: `${type}-${Date.now()}`, type, ...(defaults[type] || {}) };
    const newLayout = [...layout, newBlock];
    setLayout(newLayout);
    setSelectedIndex(newLayout.length - 1);
  };

  const removeBlock = (index: number) => {
    setLayout(layout.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= layout.length) return;
    const newLayout = [...layout];
    [newLayout[index], newLayout[target]] = [newLayout[target], newLayout[index]];
    setLayout(newLayout);
    setSelectedIndex(target);
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

  const handleSave = async () => {
    if (!nome.trim()) return toast({ title: "Nome obrigatório", variant: "destructive" });
    setLoading(true);
    try {
      if (modelo) await updateModelo(modelo.id, { nome, descricao, layout });
      else await createModelo({ nome, descricao, layout });
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const selectedBlock = selectedIndex !== null ? layout[selectedIndex] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Editor de Modelo</DialogTitle>

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do modelo *"
                className="h-8 text-sm w-52"
              />
              <Input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descrição (opcional)"
                className="h-8 text-sm w-56"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading || !nome.trim()}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {loading ? "Salvando..." : modelo ? "Salvar" : "Criar Modelo"}
            </Button>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: block palette */}
          <div className="w-44 border-r bg-muted/20 flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elementos</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {BLOCK_TYPES.map(({ type, Icon, label, description }) => (
                  <TooltipProvider key={type} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => addBlock(type)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left hover:bg-muted transition-colors group"
                        >
                          <div className="w-7 h-7 rounded bg-background border flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium leading-tight">{label}</span>
                          <Plus className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{description}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Center: visual canvas */}
          <div className="flex-1 overflow-auto bg-muted/40" onClick={() => setSelectedIndex(null)}>
            <div className="min-h-full flex justify-center py-8 px-12">
              <div
                className="w-full max-w-2xl bg-background shadow-xl rounded-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {layout.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                    <Palette className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Clique nos elementos à esquerda para começar</p>
                  </div>
                ) : (
                  <div className="p-8 space-y-3">
                    {layout.map((block, index) => (
                      <div key={block.id} className="pl-8">
                        <BlockPreview
                          block={block}
                          selected={selectedIndex === index}
                          onClick={() => setSelectedIndex(index === selectedIndex ? null : index)}
                          onMoveUp={() => moveBlock(index, "up")}
                          onMoveDown={() => moveBlock(index, "down")}
                          onDelete={() => removeBlock(index)}
                          isFirst={index === 0}
                          isLast={index === layout.length - 1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: properties panel */}
          <div className={cn(
            "border-l bg-background flex flex-col transition-all duration-200 shrink-0 overflow-hidden",
            selectedBlock ? "w-64" : "w-0"
          )}>
            {selectedBlock && selectedIndex !== null && (
              <PropertiesPanel
                block={selectedBlock}
                index={selectedIndex}
                onConfigChange={cfg => updateBlockConfig(selectedIndex, cfg)}
                onContentChange={content => updateBlockContent(selectedIndex, content)}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
