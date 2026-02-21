import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Save } from "lucide-react";
import {
  usePropostas,
  PropostaModelo,
  PropostaBlock,
  BlockConfig,
} from "@/hooks/usePropostas";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BlockPreview, PropertiesPanel, ElementPalette } from "./SharedBlockPreview";

interface ModeloEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: PropostaModelo | null;
  onSaved: () => void;
}

const defaultLayout: PropostaBlock[] = [
  { id: "header-1", type: "header", content: "Proposta Comercial", config: { alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" } },
  { id: "cliente-1", type: "cliente", config: { camposCliente: ["nome", "email", "telefone"], backgroundColor: "#f8fafc", textColor: "#334155" } },
  { id: "items-1", type: "items", config: { headerBgColor: "#f3f4f6", headerTextColor: "#111827", rowBgColor: "#ffffff", rowTextColor: "#374151", footerBgColor: "#f9fafb", footerTextColor: "#111827" } },
  { id: "conditions-1", type: "conditions", content: "Condições de pagamento e entrega a combinar.", config: { backgroundColor: "#ffffff", textColor: "#374151" } },
  { id: "assinatura-1", type: "assinatura", config: { partesAssinatura: [{ label: "Cliente" }, { label: "Empresa" }] } },
];

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
          <ElementPalette onAddBlock={addBlock} />

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
