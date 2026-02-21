import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  Mail,
  Bell,
  Clock,
  Webhook,
  Edit,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  KanbanColuna,
  PropostaAutomacao,
  AutomacaoConfig,
  usePropostasKanban,
} from "@/hooks/usePropostasKanban";
import { cn } from "@/lib/utils";

interface PropostasAutomacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_ACAO_OPTIONS = [
  { value: "email_cliente", label: "Enviar Email ao Cliente", icon: Mail },
  { value: "lembrete", label: "Criar Lembrete/Tarefa", icon: Clock },
  { value: "notificacao", label: "Notificação Interna", icon: Bell },
  { value: "webhook", label: "Webhook Externo", icon: Webhook },
];

export const PropostasAutomacoesDialog = ({
  open,
  onOpenChange,
}: PropostasAutomacoesDialogProps) => {
  const {
    colunas,
    automacoes,
    createAutomacao,
    updateAutomacao,
    deleteAutomacao,
  } = usePropostasKanban();

  const [isCreating, setIsCreating] = useState(false);
  const [editingAutomacao, setEditingAutomacao] = useState<PropostaAutomacao | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    nome: string;
    ativo: boolean;
    coluna_origem_id: string;
    coluna_destino_id: string;
    tipo_acao: string;
    config: AutomacaoConfig;
  }>({
    nome: "",
    ativo: true,
    coluna_origem_id: "",
    coluna_destino_id: "",
    tipo_acao: "notificacao",
    config: {},
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      ativo: true,
      coluna_origem_id: "",
      coluna_destino_id: "",
      tipo_acao: "notificacao",
      config: {},
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingAutomacao(null);
  };

  const handleEdit = (automacao: PropostaAutomacao) => {
    setFormData({
      nome: automacao.nome,
      ativo: automacao.ativo,
      coluna_origem_id: automacao.coluna_origem_id || "",
      coluna_destino_id: automacao.coluna_destino_id || "",
      tipo_acao: automacao.tipo_acao,
      config: automacao.config || {},
    });
    setEditingAutomacao(automacao);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.coluna_destino_id || !formData.tipo_acao) {
      return;
    }

    const data: Partial<PropostaAutomacao> = {
      nome: formData.nome,
      ativo: formData.ativo,
      coluna_origem_id: formData.coluna_origem_id || null,
      coluna_destino_id: formData.coluna_destino_id,
      tipo_acao: formData.tipo_acao as any,
      config: formData.config,
    };

    if (editingAutomacao) {
      await updateAutomacao(editingAutomacao.id, data);
    } else {
      await createAutomacao(data);
    }

    setIsCreating(false);
    setEditingAutomacao(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAutomacao(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleAtivo = async (automacao: PropostaAutomacao) => {
    await updateAutomacao(automacao.id, { ativo: !automacao.ativo });
  };

  const updateConfig = (key: keyof AutomacaoConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const getTipoAcaoIcon = (tipo: string) => {
    const option = TIPO_ACAO_OPTIONS.find((o) => o.value === tipo);
    return option?.icon || Bell;
  };

  const getColunaNome = (id: string | null | undefined) => {
    if (!id) return "Qualquer coluna";
    return colunas.find((c) => c.id === id)?.nome || "Desconhecido";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automações de Propostas</DialogTitle>
        </DialogHeader>

        {!isCreating ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Configure ações automáticas quando propostas mudarem de status
              </p>
              <Button onClick={handleCreate} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Automação
              </Button>
            </div>

            {automacoes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma automação configurada
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {automacoes.map((automacao) => {
                  const Icon = getTipoAcaoIcon(automacao.tipo_acao);
                  const isExpanded = expandedId === automacao.id;

                  return (
                    <Card key={automacao.id} className={cn(!automacao.ativo && "opacity-60")}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {automacao.nome}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {getColunaNome(automacao.coluna_origem_id)} → {getColunaNome(automacao.coluna_destino_id)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={automacao.ativo}
                              onCheckedChange={() => handleToggleAtivo(automacao)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setExpandedId(isExpanded ? null : automacao.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="px-4 pb-4 pt-2">
                          <div className="text-xs text-muted-foreground space-y-1 mb-3">
                            <p>
                              <strong>Tipo:</strong>{" "}
                              {TIPO_ACAO_OPTIONS.find((o) => o.value === automacao.tipo_acao)?.label}
                            </p>
                            {automacao.config.titulo_notificacao && (
                              <p>
                                <strong>Título:</strong> {automacao.config.titulo_notificacao}
                              </p>
                            )}
                            {automacao.config.dias_lembrete && (
                              <p>
                                <strong>Dias para lembrete:</strong> {automacao.config.dias_lembrete}
                              </p>
                            )}
                            {automacao.config.webhook_url && (
                              <p>
                                <strong>Webhook:</strong> {automacao.config.webhook_url}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(automacao)}>
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => setDeleteId(automacao.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Nome da Automação</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Notificar quando aprovada"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quando mover DE (opcional)</Label>
                <Select
                  value={formData.coluna_origem_id || "any"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, coluna_origem_id: value === "any" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer coluna</SelectItem>
                    {colunas.map((coluna) => (
                      <SelectItem key={coluna.id} value={coluna.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: coluna.cor }}
                          />
                          {coluna.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quando mover PARA *</Label>
                <Select
                  value={formData.coluna_destino_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, coluna_destino_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    {colunas.map((coluna) => (
                      <SelectItem key={coluna.id} value={coluna.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: coluna.cor }}
                          />
                          {coluna.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tipo de Ação</Label>
              <Select
                value={formData.tipo_acao}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo_acao: value, config: {} }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_ACAO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Config fields based on tipo_acao */}
            {formData.tipo_acao === "email_cliente" && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Assunto do Email</Label>
                  <Input
                    value={formData.config.assunto || ""}
                    onChange={(e) => updateConfig("assunto", e.target.value)}
                    placeholder="Atualização da sua proposta"
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={formData.config.mensagem || ""}
                    onChange={(e) => updateConfig("mensagem", e.target.value)}
                    placeholder="Olá {cliente_nome}, sua proposta foi atualizada..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {"{cliente_nome}"}, {"{proposta_titulo}"}, {"{status}"} como variáveis
                  </p>
                </div>
              </div>
            )}

            {formData.tipo_acao === "lembrete" && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Título do Lembrete</Label>
                  <Input
                    value={formData.config.titulo_lembrete || ""}
                    onChange={(e) => updateConfig("titulo_lembrete", e.target.value)}
                    placeholder="Follow-up da proposta"
                  />
                </div>
                <div>
                  <Label>Criar lembrete após quantos dias?</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.config.dias_lembrete || 3}
                    onChange={(e) => updateConfig("dias_lembrete", parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {formData.tipo_acao === "notificacao" && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Título da Notificação</Label>
                  <Input
                    value={formData.config.titulo_notificacao || ""}
                    onChange={(e) => updateConfig("titulo_notificacao", e.target.value)}
                    placeholder="Proposta atualizada"
                  />
                </div>
                <div>
                  <Label>Mensagem (opcional)</Label>
                  <Textarea
                    value={formData.config.mensagem_notificacao || ""}
                    onChange={(e) => updateConfig("mensagem_notificacao", e.target.value)}
                    placeholder="A proposta foi movida para uma nova etapa..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {formData.tipo_acao === "webhook" && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label>URL do Webhook</Label>
                  <Input
                    value={formData.config.webhook_url || ""}
                    onChange={(e) => updateConfig("webhook_url", e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                  />
                </div>
                <div>
                  <Label>Método HTTP</Label>
                  <Select
                    value={formData.config.webhook_method || "POST"}
                    onValueChange={(value) => updateConfig("webhook_method", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  O webhook receberá: proposta_id, proposta_titulo, cliente_nome, cliente_email, coluna_origem, coluna_destino
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, ativo: checked }))
                }
              />
              <Label>Automação ativa</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAutomacao(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingAutomacao ? "Salvar Alterações" : "Criar Automação"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
