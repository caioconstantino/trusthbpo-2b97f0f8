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
import { Badge } from "@/components/ui/badge";
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
  Palette,
  Settings2,
  User,
  Tag,
  Image,
  PenLine,
  CheckCircle2,
  Clock,
  Star,
  Trash2,
} from "lucide-react";
import {
  usePropostas,
  PropostaModelo,
  PropostaBlock,
  BlockConfig,
  OfertaTier,
  PrazoItem,
  AssinaturaParty,
} from "@/hooks/usePropostas";
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
  { type: "header" as const, Icon: Type, label: "Cabeçalho", description: "Título e logo da proposta", group: "Layout" },
  { type: "items" as const, Icon: List, label: "Itens", description: "Tabela de produtos/serviços", group: "Layout" },
  { type: "divider" as const, Icon: Minus, label: "Divisor", description: "Linha separadora", group: "Layout" },
  { type: "footer" as const, Icon: FileSignature, label: "Rodapé", description: "Dados da empresa", group: "Layout" },
  { type: "cliente" as const, Icon: User, label: "Dados do Cliente", description: "Campos do destinatário", group: "Conteúdo" },
  { type: "oferta" as const, Icon: Tag, label: "Oferta / Preços", description: "Cards de planos ou opções", group: "Conteúdo" },
  { type: "beneficios" as const, Icon: CheckCircle2, label: "Benefícios", description: "Lista de vantagens", group: "Conteúdo" },
  { type: "prazo" as const, Icon: Clock, label: "Prazo / Timeline", description: "Cronograma de entregas", group: "Conteúdo" },
  { type: "imagem" as const, Icon: Image, label: "Imagem", description: "Banner ou foto", group: "Mídia" },
  { type: "assinatura" as const, Icon: PenLine, label: "Assinatura", description: "Campos de assinatura", group: "Finalização" },
  { type: "conditions" as const, Icon: FileText, label: "Condições", description: "Texto de condições gerais", group: "Finalização" },
  { type: "text" as const, Icon: Type, label: "Texto livre", description: "Parágrafo personalizado", group: "Layout" },
];

const CLIENT_FIELDS = [
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "documento", label: "Documento (CPF/CNPJ)" },
  { key: "endereco", label: "Endereço" },
  { key: "empresa", label: "Empresa" },
];

const defaultLayout: PropostaBlock[] = [
  { id: "header-1", type: "header", content: "Proposta Comercial", config: { alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" } },
  { id: "cliente-1", type: "cliente", config: { camposCliente: ["nome", "email", "telefone"], backgroundColor: "#f8fafc", textColor: "#334155" } },
  { id: "items-1", type: "items", config: { headerBgColor: "#f3f4f6", headerTextColor: "#111827", rowBgColor: "#ffffff", rowTextColor: "#374151", footerBgColor: "#f9fafb", footerTextColor: "#111827" } },
  { id: "conditions-1", type: "conditions", content: "Condições de pagamento e entrega a combinar.", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
  { id: "assinatura-1", type: "assinatura", config: { partesAssinatura: [{ label: "Cliente" }, { label: "Empresa" }] } },
];

// ─── Block previews ──────────────────────────────────────────────────────────

function BlockPreview({
  block, selected, onClick, onMoveUp, onMoveDown, onDelete, isFirst, isLast,
}: {
  block: PropostaBlock; selected: boolean;
  onClick: () => void; onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void;
  isFirst: boolean; isLast: boolean;
}) {
  const cfg = block.config || {};

  const renderContent = () => {
    switch (block.type) {
      case "header":
        return (
          <div className="w-full rounded-md overflow-hidden" style={{ backgroundColor: cfg.backgroundColor || "#1e3a5f", padding: "24px 32px" }}>
            <div className={cn("flex items-center gap-4", {
              "justify-start": cfg.alignment === "left",
              "justify-center": !cfg.alignment || cfg.alignment === "center",
              "justify-end": cfg.alignment === "right",
            })}>
              {cfg.logoUrl && <img src={cfg.logoUrl} alt="Logo" className="h-12 object-contain" />}
              <span className="text-xl font-bold" style={{ color: cfg.textColor || "#ffffff" }}>
                {block.content || "Proposta Comercial"}
              </span>
            </div>
          </div>
        );

      case "cliente": {
        const campos = cfg.camposCliente || ["nome", "email", "telefone"];
        return (
          <div className="w-full rounded-md px-5 py-4" style={{ backgroundColor: cfg.backgroundColor || "#f8fafc" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: cfg.textColor || "#334155", opacity: 0.6 }}>
              Destinatário
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {campos.map(c => {
                const field = CLIENT_FIELDS.find(f => f.key === c);
                return (
                  <div key={c} className="flex gap-2 text-xs" style={{ color: cfg.textColor || "#334155" }}>
                    <span className="font-medium opacity-60">{field?.label}:</span>
                    <span className="italic opacity-40">{`{${c}}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "oferta": {
        const tiers: OfertaTier[] = cfg.ofertas || [
          { nome: "Básico", preco: "R$ 0,00", features: ["Feature 1", "Feature 2"] },
          { nome: "Pro", preco: "R$ 0,00", destaque: true, corDestaque: "#1e3a5f", features: ["Feature 1", "Feature 2", "Feature 3"] },
        ];
        return (
          <div className={cn("w-full grid gap-3", tiers.length === 1 ? "grid-cols-1" : tiers.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className="rounded-lg border p-4 flex flex-col gap-2 relative"
                style={tier.destaque ? { backgroundColor: tier.corDestaque || "#1e3a5f", borderColor: "transparent" } : { backgroundColor: "#ffffff" }}
              >
                {tier.destaque && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5" /> RECOMENDADO
                    </span>
                  </div>
                )}
                <p className="text-sm font-bold" style={{ color: tier.destaque ? "#ffffff" : "#111827" }}>{tier.nome}</p>
                <p className="text-xl font-black" style={{ color: tier.destaque ? "#ffffff" : "#1e3a5f" }}>{tier.preco}</p>
                {tier.descricao && <p className="text-xs" style={{ color: tier.destaque ? "#ffffffaa" : "#6b7280" }}>{tier.descricao}</p>}
                <ul className="space-y-0.5 mt-1">
                  {(tier.features || []).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-1.5 text-xs" style={{ color: tier.destaque ? "#ffffffcc" : "#374151" }}>
                      <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: tier.destaque ? "#ffffff" : "#22c55e" }} />
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
        const items = (block.content || "Benefício 1\nBenefício 2\nBenefício 3").split("\n").filter(Boolean);
        const cols = parseInt(cfg.colunasBeneficios || "2");
        const icon = cfg.iconeBeneficios || "check";
        const IconComp = icon === "star" ? Star : CheckCircle2;
        return (
          <div className="w-full rounded-md px-5 py-4" style={{ backgroundColor: cfg.backgroundColor || "#ffffff" }}>
            <div className={cn("grid gap-2", cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: cfg.textColor || "#374151" }}>
                  <IconComp className="h-4 w-4 shrink-0 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "prazo": {
        const itens: PrazoItem[] = cfg.itensPrazo || [
          { label: "Início do projeto", data: "01/01/2025" },
          { label: "Entrega parcial", data: "15/01/2025" },
          { label: "Entrega final", data: "30/01/2025" },
        ];
        return (
          <div className="w-full rounded-md px-5 py-4" style={{ backgroundColor: cfg.backgroundColor || "#ffffff" }}>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-3">
                {itens.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 pl-8 relative">
                    <div className="absolute left-0 w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center" style={{ borderColor: cfg.textColor || "#1e3a5f" }}>
                      <span className="text-[9px] font-bold" style={{ color: cfg.textColor || "#1e3a5f" }}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: cfg.textColor || "#111827" }}>{item.label}</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: (cfg.textColor || "#1e3a5f") + "18", color: cfg.textColor || "#1e3a5f" }}>
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
          <div className="w-full rounded-md overflow-hidden" style={{ textAlign: (cfg.alignment as "left" | "center" | "right") || "center" }}>
            {cfg.imageUrl ? (
              <div>
                <img
                  src={cfg.imageUrl}
                  alt="Imagem"
                  className="inline-block rounded"
                  style={{ width: cfg.imageWidth === "full" ? "100%" : cfg.imageWidth === "75" ? "75%" : cfg.imageWidth === "50" ? "50%" : "100%", maxHeight: 200, objectFit: "cover" }}
                />
                {cfg.imageCaption && <p className="text-xs text-muted-foreground mt-1 italic">{cfg.imageCaption}</p>}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 rounded-md border-2 border-dashed border-border bg-muted/30 gap-2">
                <Image className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Clique para configurar a imagem</p>
              </div>
            )}
          </div>
        );

      case "assinatura": {
        const parties: AssinaturaParty[] = cfg.partesAssinatura || [{ label: "Cliente" }, { label: "Empresa" }];
        return (
          <div className="w-full rounded-md px-5 py-6" style={{ backgroundColor: cfg.backgroundColor || "#ffffff" }}>
            <div className={cn("grid gap-8", parties.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {parties.map((party, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-full border-b-2 border-border h-10" />
                  <p className="text-xs font-medium text-muted-foreground">{party.label}</p>
                  <p className="text-[10px] text-muted-foreground/60">Assinatura e data</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "items":
        return (
          <div className="w-full rounded-md overflow-hidden border border-border/30">
            <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold" style={{ backgroundColor: cfg.headerBgColor || "#f3f4f6", color: cfg.headerTextColor || "#111827" }}>
              <span>Descrição</span><span className="text-center">Qtd</span><span className="text-center">Preço Unit.</span><span className="text-right">Total</span>
            </div>
            {[1, 2].map(i => (
              <div key={i} className="grid grid-cols-4 px-4 py-2 text-xs border-t border-border/20" style={{ backgroundColor: cfg.rowBgColor || "#ffffff", color: cfg.rowTextColor || "#374151" }}>
                <span>Produto {i}</span><span className="text-center">1</span><span className="text-center">R$ 0,00</span><span className="text-right">R$ 0,00</span>
              </div>
            ))}
            <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold border-t border-border/30" style={{ backgroundColor: cfg.footerBgColor || "#f9fafb", color: cfg.footerTextColor || "#111827" }}>
              <span className="col-span-3 text-right">Total</span><span className="text-right">R$ 0,00</span>
            </div>
          </div>
        );

      case "divider":
        return <div className="w-full py-2"><hr style={{ borderColor: cfg.borderColor || "#e5e7eb", borderTopWidth: 2 }} /></div>;

      case "footer":
        return (
          <div className="w-full rounded-md px-6 py-4" style={{ backgroundColor: cfg.backgroundColor || "#f3f4f6" }}>
            <div className="flex justify-between items-end text-xs" style={{ color: cfg.textColor || "#666666" }}>
              <div className="space-y-0.5">
                <p className="font-semibold">{cfg.companyName || "Nome da Empresa"}</p>
                {cfg.companyPhone && <p>{cfg.companyPhone}</p>}
                {cfg.companyEmail && <p>{cfg.companyEmail}</p>}
              </div>
              {cfg.companyAddress && <p className="text-right max-w-xs">{cfg.companyAddress}</p>}
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full rounded-md px-4 py-3 text-sm" style={{
            backgroundColor: cfg.backgroundColor || "#ffffff",
            color: cfg.textColor || "#374151",
            fontSize: cfg.fontSize === "small" ? "11px" : cfg.fontSize === "large" ? "15px" : "13px",
            textAlign: (cfg.alignment as "left" | "center" | "right") || "left",
          }}>
            {block.content || (block.type === "conditions" ? "Condições de pagamento e entrega..." : "Texto do bloco...")}
          </div>
        );
    }
  };

  return (
    <div
      className={cn("group relative rounded-lg border-2 cursor-pointer transition-all duration-150",
        selected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30")}
      onClick={onClick}
    >
      <div className={cn("absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", selected && "opacity-100")}>
        <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="p-0.5 rounded hover:bg-muted disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /></button>
        <GripVertical className="h-4 w-4 text-muted-foreground/50 mx-auto" />
        <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="p-0.5 rounded hover:bg-muted disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={cn("absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10", selected && "opacity-100")}>
        <X className="h-3 w-3" />
      </button>
      <div className={cn("absolute top-1 right-6 text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity", selected ? "bg-primary text-primary-foreground opacity-100" : "bg-muted text-muted-foreground")}>
        {BLOCK_TYPES.find(b => b.type === block.type)?.label}
      </div>
      <div className="p-1">{renderContent()}</div>
    </div>
  );
}

// ─── Properties panel ────────────────────────────────────────────────────────

function PropertiesPanel({ block, onConfigChange, onContentChange }: {
  block: PropostaBlock;
  onConfigChange: (config: BlockConfig) => void;
  onContentChange: (content: string) => void;
}) {
  const cfg = block.config || {};
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof BlockConfig, value: unknown) =>
    onConfigChange({ ...cfg, [key]: value });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, configKey: "logoUrl" | "imageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: "Selecione uma imagem", variant: "destructive" });
    if (file.size > 2 * 1024 * 1024) return toast({ title: "Máximo 2MB", variant: "destructive" });
    setUploading(true);
    try {
      const dominio = localStorage.getItem("user_dominio") || "default";
      const fileName = `${dominio}/propostas-${configKey}-${Date.now()}.${file.name.split(".").pop()}`;
      const { data, error } = await supabase.storage.from("produtos").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("produtos").getPublicUrl(data.path);
      update(configKey, pub.publicUrl);
      toast({ title: "Imagem enviada!" });
    } catch {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const ColorRow = ({ label, configKey, defaultValue }: { label: string; configKey: keyof BlockConfig; defaultValue: string }) => (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground shrink-0">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input type="color" value={(cfg[configKey] as string) || defaultValue} onChange={e => update(configKey, e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border p-0.5" />
        <Input value={(cfg[configKey] as string) || defaultValue} onChange={e => update(configKey, e.target.value)} className="h-7 text-xs w-24" />
      </div>
    </div>
  );

  const AlignButtons = () => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map(align => {
        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
        return (
          <button key={align} onClick={() => update("alignment", align)} className={cn("p-1.5 rounded border transition-colors", (cfg.alignment === align || (!cfg.alignment && align === "left")) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );

  // ── Oferta panel ──
  const ofertaPanel = () => {
    const tiers: OfertaTier[] = cfg.ofertas || [{ nome: "Básico", preco: "R$ 0,00", features: [] }];
    const setTiers = (t: OfertaTier[]) => update("ofertas", t);
    const addTier = () => setTiers([...tiers, { nome: `Opção ${tiers.length + 1}`, preco: "R$ 0,00", features: [] }]);
    const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));
    const updateTier = (i: number, key: keyof OfertaTier, value: unknown) => {
      const t = [...tiers];
      t[i] = { ...t[i], [key]: value };
      setTiers(t);
    };
    const updateFeatures = (i: number, text: string) => updateTier(i, "features", text.split("\n").filter(Boolean));
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Configure cada opção de preço</p>
        {tiers.map((tier, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Opção {i + 1}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={tier.destaque || false} onChange={e => updateTier(i, "destaque", e.target.checked)} className="rounded" />
                  Destaque
                </label>
                {tiers.length > 1 && (
                  <button onClick={() => removeTier(i)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <Input value={tier.nome} onChange={e => updateTier(i, "nome", e.target.value)} placeholder="Nome do plano" className="h-7 text-xs" />
            <Input value={tier.preco} onChange={e => updateTier(i, "preco", e.target.value)} placeholder="R$ 0,00" className="h-7 text-xs" />
            <Input value={tier.descricao || ""} onChange={e => updateTier(i, "descricao", e.target.value)} placeholder="Descrição curta..." className="h-7 text-xs" />
            {tier.destaque && (
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">Cor</Label>
                <input type="color" value={tier.corDestaque || "#1e3a5f"} onChange={e => updateTier(i, "corDestaque", e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-border p-0.5" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Recursos (um por linha)</Label>
              <Textarea value={(tier.features || []).join("\n")} onChange={e => updateFeatures(i, e.target.value)} rows={3} className="text-xs resize-none" placeholder={"Recurso 1\nRecurso 2"} />
            </div>
          </div>
        ))}
        {tiers.length < 4 && (
          <Button variant="outline" size="sm" className="w-full" onClick={addTier}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar opção
          </Button>
        )}
      </div>
    );
  };

  // ── Cliente panel ──
  const clientePanel = () => {
    const campos = cfg.camposCliente || ["nome", "email", "telefone"];
    const toggle = (key: string) => {
      const newCampos = campos.includes(key) ? campos.filter(c => c !== key) : [...campos, key];
      update("camposCliente", newCampos);
    };
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campos exibidos</p>
          <div className="space-y-2">
            {CLIENT_FIELDS.map(field => (
              <label key={field.key} className="flex items-center gap-2.5 cursor-pointer text-sm">
                <input type="checkbox" checked={campos.includes(field.key)} onChange={() => toggle(field.key)} className="rounded" />
                {field.label}
              </label>
            ))}
          </div>
        </div>
        <Separator />
        <section className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cores</p>
          <ColorRow label="Fundo" configKey="backgroundColor" defaultValue="#f8fafc" />
          <ColorRow label="Texto" configKey="textColor" defaultValue="#334155" />
        </section>
      </div>
    );
  };

  // ── Prazo panel ──
  const prazoPanel = () => {
    const itens: PrazoItem[] = cfg.itensPrazo || [{ label: "Etapa 1", data: "" }];
    const setItens = (v: PrazoItem[]) => update("itensPrazo", v);
    const addItem = () => setItens([...itens, { label: `Etapa ${itens.length + 1}`, data: "" }]);
    const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
    const updateItem = (i: number, key: keyof PrazoItem, value: string) => {
      const t = [...itens]; t[i] = { ...t[i], [key]: value }; setItens(t);
    };
    return (
      <div className="space-y-4">
        {itens.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 space-y-1.5">
              <Input value={item.label} onChange={e => updateItem(i, "label", e.target.value)} placeholder="Etapa..." className="h-7 text-xs" />
              <Input value={item.data} onChange={e => updateItem(i, "data", e.target.value)} placeholder="Data ou período..." className="h-7 text-xs" />
            </div>
            {itens.length > 1 && (
              <button onClick={() => removeItem(i)} className="text-destructive hover:text-destructive/80 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar etapa
        </Button>
        <Separator />
        <ColorRow label="Cor de destaque" configKey="textColor" defaultValue="#1e3a5f" />
        <ColorRow label="Fundo" configKey="backgroundColor" defaultValue="#ffffff" />
      </div>
    );
  };

  // ── Assinatura panel ──
  const assinaturaPanel = () => {
    const parties: AssinaturaParty[] = cfg.partesAssinatura || [{ label: "Cliente" }, { label: "Empresa" }];
    const setParties = (v: AssinaturaParty[]) => update("partesAssinatura", v);
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Adicione os assinantes do documento</p>
        {parties.map((party, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={party.label} onChange={e => { const p = [...parties]; p[i] = { label: e.target.value }; setParties(p); }} placeholder="Nome do assinante" className="h-7 text-xs flex-1" />
            {parties.length > 1 && (
              <button onClick={() => setParties(parties.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </div>
        ))}
        {parties.length < 4 && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setParties([...parties, { label: "Assinante" }])}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar assinante
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{BLOCK_TYPES.find(b => b.type === block.type)?.label}</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">

          {block.type === "header" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</p>
              <div className="space-y-1.5"><Label className="text-xs">Título</Label>
                <Input value={block.content || ""} onChange={e => onContentChange(e.target.value)} placeholder="Proposta Comercial" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Alinhamento</Label><AlignButtons /></div>
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Logo</p>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={e => handleUpload(e, "logoUrl")} className="hidden" />
              {cfg.logoUrl
                ? <div className="relative inline-block"><img src={cfg.logoUrl} alt="Logo" className="max-h-16 rounded border" /><button onClick={() => update("logoUrl", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button></div>
                : <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full"><Upload className="h-3.5 w-3.5 mr-2" />{uploading ? "Enviando..." : "Enviar Logo"}</Button>
              }
            </section>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cores</p>
              <ColorRow label="Fundo" configKey="backgroundColor" defaultValue="#1e3a5f" />
              <ColorRow label="Texto" configKey="textColor" defaultValue="#ffffff" />
            </section>
          </>}

          {block.type === "cliente" && clientePanel()}
          {block.type === "oferta" && ofertaPanel()}
          {block.type === "prazo" && prazoPanel()}
          {block.type === "assinatura" && assinaturaPanel()}

          {block.type === "imagem" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Imagem</p>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={e => handleUpload(e, "imageUrl")} className="hidden" />
              {cfg.imageUrl
                ? <div className="relative"><img src={cfg.imageUrl} alt="" className="w-full rounded border max-h-32 object-cover" /><button onClick={() => update("imageUrl", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button></div>
                : <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full"><Upload className="h-3.5 w-3.5 mr-2" />{uploading ? "Enviando..." : "Enviar Imagem"}</Button>
              }
              <div className="space-y-1.5"><Label className="text-xs">Legenda</Label>
                <Input value={cfg.imageCaption || ""} onChange={e => update("imageCaption", e.target.value)} placeholder="Legenda da imagem..." className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Largura</Label>
                <Select value={cfg.imageWidth || "full"} onValueChange={v => update("imageWidth", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">100% (Largura total)</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Alinhamento</Label><AlignButtons /></div>
            </section>
          </>}

          {block.type === "beneficios" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Benefícios</p>
              <div className="space-y-1.5"><Label className="text-xs">Lista (um por linha)</Label>
                <Textarea value={block.content || ""} onChange={e => onContentChange(e.target.value)} rows={6} placeholder={"Entrega em 24h\nGarantia de 1 ano\nSuporte incluso"} className="text-sm resize-none" />
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Colunas</Label>
                <Select value={cfg.colunasBeneficios || "2"} onValueChange={v => update("colunasBeneficios", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 coluna</SelectItem>
                    <SelectItem value="2">2 colunas</SelectItem>
                    <SelectItem value="3">3 colunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Ícone</Label>
                <Select value={cfg.iconeBeneficios || "check"} onValueChange={v => update("iconeBeneficios", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check">✓ Check</SelectItem>
                    <SelectItem value="star">★ Estrela</SelectItem>
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

          {(block.type === "conditions" || block.type === "text") && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</p>
              <Textarea value={block.content || ""} onChange={e => onContentChange(e.target.value)} rows={5} placeholder={block.type === "conditions" ? "Condições de pagamento..." : "Digite o texto..."} className="text-sm resize-none" />
              <div className="space-y-1.5"><Label className="text-xs">Alinhamento</Label><AlignButtons /></div>
              <div className="space-y-1.5"><Label className="text-xs">Tamanho da Fonte</Label>
                <Select value={cfg.fontSize || "normal"} onValueChange={v => update("fontSize", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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

          {block.type === "divider" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estilo</p>
              <ColorRow label="Cor da linha" configKey="borderColor" defaultValue="#e5e7eb" />
              <div className="space-y-1.5"><Label className="text-xs">Espaçamento</Label>
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

          {block.type === "footer" && <>
            <section className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados da Empresa</p>
              {[
                { key: "companyName", label: "Nome", placeholder: "Nome da empresa" },
                { key: "companyPhone", label: "Telefone", placeholder: "(00) 00000-0000" },
                { key: "companyEmail", label: "Email", placeholder: "contato@empresa.com" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input value={(cfg[key as keyof BlockConfig] as string) || ""} onChange={e => update(key as keyof BlockConfig, e.target.value)} placeholder={placeholder} className="h-8 text-sm" />
                </div>
              ))}
              <div className="space-y-1.5"><Label className="text-xs">Endereço</Label>
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
    const defaults: Partial<Record<PropostaBlock["type"], Partial<PropostaBlock>>> = {
      header: { content: "Novo Cabeçalho", config: { alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" } },
      items: { config: { headerBgColor: "#f3f4f6", headerTextColor: "#111827", rowBgColor: "#ffffff", rowTextColor: "#374151" } },
      conditions: { content: "Condições de pagamento e entrega a combinar.", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
      text: { content: "Digite seu texto aqui...", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
      divider: { config: { borderColor: "#e5e7eb", padding: "normal" } },
      footer: { config: { backgroundColor: "#f3f4f6", textColor: "#666666" } },
      cliente: { config: { camposCliente: ["nome", "email", "telefone"], backgroundColor: "#f8fafc", textColor: "#334155" } },
      oferta: { config: { ofertas: [{ nome: "Básico", preco: "R$ 0,00", features: ["Feature 1"] }, { nome: "Pro", preco: "R$ 0,00", destaque: true, features: ["Feature 1", "Feature 2"] }] } },
      beneficios: { content: "Entrega em 24h\nGarantia de 1 ano\nSuporte incluso", config: { colunasBeneficios: "2", iconeBeneficios: "check", backgroundColor: "#ffffff", textColor: "#374151" } },
      prazo: { config: { itensPrazo: [{ label: "Início do projeto", data: "01/01/2025" }, { label: "Entrega final", data: "30/01/2025" }], backgroundColor: "#ffffff", textColor: "#1e3a5f" } },
      imagem: { config: { imageWidth: "full", alignment: "center" } },
      assinatura: { config: { partesAssinatura: [{ label: "Cliente" }, { label: "Empresa" }] } },
    };
    const newBlock: PropostaBlock = { id: `${type}-${Date.now()}`, type, ...(defaults[type] || {}) };
    const newLayout = [...layout, newBlock];
    setLayout(newLayout);
    setSelectedIndex(newLayout.length - 1);
  };

  const removeBlock = (index: number) => { setLayout(layout.filter((_, i) => i !== index)); setSelectedIndex(null); };
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

  // Group block types
  const groups = Array.from(new Set(BLOCK_TYPES.map(b => b.group)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[1280px] h-[93vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Editor de Modelo</DialogTitle>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do modelo *" className="h-8 text-sm w-52" />
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="h-8 text-sm w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={loading || !nome.trim()}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {loading ? "Salvando..." : modelo ? "Salvar" : "Criar Modelo"}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left palette */}
          <div className="w-44 border-r bg-muted/20 flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elementos</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {groups.map(group => (
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
          <div className="flex-1 overflow-auto bg-muted/40" onClick={() => setSelectedIndex(null)}>
            <div className="min-h-full flex justify-center py-8 px-12">
              <div className="w-full max-w-2xl bg-background shadow-xl rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
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

          {/* Right properties panel */}
          <div className={cn("border-l bg-background flex flex-col transition-all duration-200 shrink-0 overflow-hidden", selectedBlock ? "w-64" : "w-0")}>
            {selectedBlock && selectedIndex !== null && (
              <PropertiesPanel
                block={selectedBlock}
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
