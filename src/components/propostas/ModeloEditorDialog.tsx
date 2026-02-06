import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  GripVertical,
  Trash2,
  Type,
  List,
  FileText,
  Minus,
  Save,
  Settings,
  FileSignature,
} from "lucide-react";
import { usePropostas, PropostaModelo, PropostaBlock, BlockConfig } from "@/hooks/usePropostas";
import { toast } from "@/hooks/use-toast";
import { BlockConfigPanel } from "./BlockConfigPanel";

interface ModeloEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: PropostaModelo | null;
  onSaved: () => void;
}

const blockTypeIcons = {
  header: Type,
  items: List,
  conditions: FileText,
  text: Type,
  divider: Minus,
  footer: FileSignature,
};

const blockTypeLabels = {
  header: "Cabeçalho",
  items: "Itens da Proposta",
  conditions: "Condições",
  text: "Texto",
  divider: "Divisor",
  footer: "Rodapé",
};

const defaultLayout: PropostaBlock[] = [
  { id: "header-1", type: "header", content: "Proposta Comercial", config: { alignment: "center" } },
  { id: "items-1", type: "items", config: {} },
  { id: "conditions-1", type: "conditions", content: "Condições de pagamento e entrega a combinar.", config: {} },
];

export function ModeloEditorDialog({
  open,
  onOpenChange,
  modelo,
  onSaved,
}: ModeloEditorDialogProps) {
  const { createModelo, updateModelo } = usePropostas();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [layout, setLayout] = useState<PropostaBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      if (modelo) {
        setNome(modelo.nome);
        setDescricao(modelo.descricao || "");
        setLayout(modelo.layout || []);
      } else {
        setNome("");
        setDescricao("");
        setLayout(defaultLayout);
      }
      setConfigPanelOpen(false);
      setSelectedBlockIndex(null);
    }
  }, [open, modelo]);

  const addBlock = (type: PropostaBlock["type"]) => {
    const newBlock: PropostaBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: type === "header" ? "Novo Cabeçalho" : type === "conditions" ? "Condições..." : "",
      config: type === "header" ? { alignment: "center" } : {},
    };
    setLayout([...layout, newBlock]);
  };

  const removeBlock = (index: number) => {
    setLayout(layout.filter((_, i) => i !== index));
    if (selectedBlockIndex === index) {
      setConfigPanelOpen(false);
      setSelectedBlockIndex(null);
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

  const openConfigPanel = (index: number) => {
    setSelectedBlockIndex(index);
    setConfigPanelOpen(true);
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

  const handleSave = async () => {
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do modelo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (modelo) {
        await updateModelo(modelo.id, { nome, descricao, layout });
      } else {
        await createModelo({ nome, descricao, layout });
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const selectedBlock = selectedBlockIndex !== null ? layout[selectedBlockIndex] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {modelo ? "Editar Modelo" : "Novo Modelo de Proposta"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden px-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Modelo *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Proposta de Serviços"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do modelo..."
              />
            </div>
          </div>

          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Painel de elementos */}
            <div className="w-48 border rounded-lg p-3 space-y-2 shrink-0">
              <p className="text-sm font-medium mb-3">Elementos</p>
              {(["header", "items", "conditions", "text", "divider", "footer"] as const).map(
                (type) => {
                  const Icon = blockTypeIcons[type];
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addBlock(type)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {blockTypeLabels[type]}
                    </Button>
                  );
                }
              )}
            </div>

            {/* Área de layout */}
            <ScrollArea className="flex-1 border rounded-lg p-4">
              <div className="space-y-2 min-h-[300px]">
                {layout.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Clique nos elementos à esquerda para adicionar</p>
                    <p className="text-sm">Arraste para reordenar</p>
                  </div>
                ) : (
                  layout.map((block, index) => {
                    const Icon = blockTypeIcons[block.type];
                    return (
                      <Card
                        key={block.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move ${
                          draggedIndex === index ? "opacity-50" : ""
                        } ${selectedBlockIndex === index ? "ring-2 ring-primary" : ""}`}
                      >
                        <CardContent className="p-3 flex items-start gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {blockTypeLabels[block.type]}
                              </span>
                              {block.config?.logoUrl && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Com logo
                                </span>
                              )}
                              {block.config?.backgroundColor && (
                                <div 
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: block.config.backgroundColor }}
                                />
                              )}
                            </div>
                            {block.type === "items" ? (
                              <p className="text-sm text-muted-foreground">
                                Os itens serão inseridos aqui
                              </p>
                            ) : block.type === "divider" ? (
                              <hr className="border-t-2" />
                            ) : block.type === "footer" ? (
                              <p className="text-sm text-muted-foreground">
                                {block.config?.companyName || "Informações da empresa"}
                              </p>
                            ) : (
                              <Textarea
                                value={block.content || ""}
                                onChange={(e) =>
                                  updateBlockContent(index, e.target.value)
                                }
                                placeholder="Digite o conteúdo padrão..."
                                className="min-h-[60px]"
                              />
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openConfigPanel(index)}
                              title="Configurar bloco"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBlock(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Painel de configuração */}
            {configPanelOpen && selectedBlock && selectedBlockIndex !== null && (
              <div className="w-80 border rounded-lg overflow-hidden shrink-0">
                <BlockConfigPanel
                  blockType={selectedBlock.type}
                  config={selectedBlock.config || {}}
                  content={selectedBlock.content}
                  onConfigChange={(config) => updateBlockConfig(selectedBlockIndex, config)}
                  onContentChange={(content) => updateBlockContent(selectedBlockIndex, content)}
                  onClose={() => {
                    setConfigPanelOpen(false);
                    setSelectedBlockIndex(null);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !nome.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : modelo ? "Salvar Alterações" : "Criar Modelo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
