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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { usePropostas, Proposta, PropostaBlock, PropostaItem } from "@/hooks/usePropostas";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";
import { toast } from "@/hooks/use-toast";

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

const blockTypeIcons = {
  header: Type,
  items: List,
  conditions: FileText,
  text: Type,
  divider: Minus,
};

const blockTypeLabels = {
  header: "Cabeçalho",
  items: "Itens da Proposta",
  conditions: "Condições",
  text: "Texto",
  divider: "Divisor",
};

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
    const newBlock: PropostaBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: type === "header" ? "Novo Cabeçalho" : type === "conditions" ? "Condições..." : "",
    };
    setLayout([...layout, newBlock]);
  };

  const removeBlock = (index: number) => {
    setLayout(layout.filter((_, i) => i !== index));
  };

  const updateBlockContent = (index: number, content: string) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], content };
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Proposta #{proposta.numero}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="layout" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="flex-1 flex flex-col">
            <div className="flex gap-4 flex-1 overflow-hidden">
              {/* Painel de elementos */}
              <div className="w-48 border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium mb-3">Elementos</p>
                {(["header", "items", "conditions", "text", "divider"] as const).map(
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
                <div className="space-y-2 min-h-[400px]">
                  {layout.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Arraste elementos para construir sua proposta</p>
                      <p className="text-sm">
                        Clique nos elementos à esquerda para adicionar
                      </p>
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
                          }`}
                        >
                          <CardContent className="p-3 flex items-start gap-2">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {blockTypeLabels[block.type]}
                                </span>
                              </div>
                              {block.type === "items" ? (
                                <p className="text-sm text-muted-foreground">
                                  {itens.length} item(ns) - Total:{" "}
                                  {calcularTotal().toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </p>
                              ) : block.type === "divider" ? (
                                <hr className="border-t-2" />
                              ) : (
                                <Textarea
                                  value={block.content || ""}
                                  onChange={(e) =>
                                    updateBlockContent(index, e.target.value)
                                  }
                                  placeholder="Digite o conteúdo..."
                                  className="min-h-[60px]"
                                />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBlock(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="itens" className="flex-1">
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-4">
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
                              {produtos.map((p) => (
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
                            onChange={(e) =>
                              updateItem(index, "descricao", e.target.value)
                            }
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
                            onChange={(e) =>
                              updateItem(index, "quantidade", parseFloat(e.target.value))
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Preço</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.preco_unitario || ""}
                            onChange={(e) =>
                              updateItem(index, "preco_unitario", parseFloat(e.target.value))
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Desc %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.desconto_percentual || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "desconto_percentual",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Total</Label>
                          <Input
                            value={(item.total || 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                            disabled
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={itens.length === 1}
                          >
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
                      {calcularTotal().toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="config" className="flex-1">
            <div className="grid gap-4 max-w-lg">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Proposta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
