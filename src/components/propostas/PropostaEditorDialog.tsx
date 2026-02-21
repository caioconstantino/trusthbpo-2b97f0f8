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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Save, Palette } from "lucide-react";
import { usePropostas, Proposta, PropostaBlock, PropostaItem, BlockConfig } from "@/hooks/usePropostas";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BlockPreview, PropertiesPanel, ElementPalette } from "./SharedBlockPreview";

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"layout" | "itens" | "config">("layout");

  useEffect(() => {
    if (open && proposta) {
      setLayout(proposta.layout || []);
      setTitulo(proposta.titulo);
      setCondicoes(proposta.condicoes || "");
      setStatus(proposta.status);
      setSelectedIndex(null);
      loadItens();
      loadProdutos();
    }
  }, [open, proposta]);

  const loadItens = async () => {
    const data = await fetchItens(proposta.id);
    setItens(
      data.length > 0
        ? data.map((item) => ({ ...item, produto_id: item.produto_id }))
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
    const defaults: Partial<Record<PropostaBlock["type"], Partial<PropostaBlock>>> = {
      header: { content: "Proposta Comercial", config: { alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" } },
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

  // ── Items management ──
  const addItem = () => {
    setItens([...itens, { descricao: "", quantidade: 1, preco_unitario: 0, desconto_percentual: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
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

  const calcularTotal = () => itens.reduce((acc, item) => acc + (item.total || 0), 0);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProposta(proposta.id, { titulo, layout, condicoes, status, total: calcularTotal() });
      await saveItens(proposta.id, itens);
      toast({ title: "Sucesso", description: "Proposta salva com sucesso" });
      onSaved();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedBlock = selectedIndex !== null ? layout[selectedIndex] : null;

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
                        <Select value={item.produto_id?.toString() || ""} onValueChange={(v) => selectProduto(index, v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {produtos.filter((p) => p.id != null && p.id.toString() !== "").map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Descrição</Label>
                        <Input value={item.descricao || ""} onChange={(e) => updateItem(index, "descricao", e.target.value)} placeholder="Descrição do item" />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input type="number" min="0.001" step="0.001" value={item.quantidade || ""} onChange={(e) => updateItem(index, "quantidade", parseFloat(e.target.value))} />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Preço</Label>
                        <Input type="number" min="0" step="0.01" value={item.preco_unitario || ""} onChange={(e) => updateItem(index, "preco_unitario", parseFloat(e.target.value))} />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Desc %</Label>
                        <Input type="number" min="0" max="100" value={item.desconto_percentual || ""} onChange={(e) => updateItem(index, "desconto_percentual", parseFloat(e.target.value))} />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Total</Label>
                        <Input value={(item.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} disabled />
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
                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Textarea value={condicoes} onChange={(e) => setCondicoes(e.target.value)} placeholder="Condições de pagamento, prazo de entrega, garantias..." rows={5} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
