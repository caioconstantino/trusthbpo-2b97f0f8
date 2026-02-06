import { useState, useMemo, DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Phone,
  Mail,
  GripVertical,
  Plus,
  Search,
  Trash2,
  MoveHorizontal,
  Settings,
  Edit,
  MoreVertical,
} from "lucide-react";
import { Proposta } from "@/hooks/usePropostas";
import { KanbanColuna, usePropostasKanban } from "@/hooks/usePropostasKanban";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PropostasKanbanProps {
  propostas: Proposta[];
  onViewProposta: (proposta: Proposta) => void;
  onEditProposta: (proposta: Proposta) => void;
  onOpenAutomacoes: () => void;
  onRefresh: () => void;
}

const AVAILABLE_COLORS = [
  { id: "#6b7280", label: "Cinza" },
  { id: "#3b82f6", label: "Azul" },
  { id: "#22c55e", label: "Verde" },
  { id: "#ef4444", label: "Vermelho" },
  { id: "#f59e0b", label: "Amarelo" },
  { id: "#8b5cf6", label: "Roxo" },
  { id: "#ec4899", label: "Rosa" },
  { id: "#14b8a6", label: "Teal" },
];

export const PropostasKanban = ({
  propostas,
  onViewProposta,
  onEditProposta,
  onOpenAutomacoes,
  onRefresh,
}: PropostasKanbanProps) => {
  const {
    colunas,
    loading,
    createColuna,
    updateColuna,
    deleteColuna,
    reorderColunas,
    executeAutomacoes,
  } = usePropostasKanban();

  const [searchTerm, setSearchTerm] = useState("");
  const [draggedProposta, setDraggedProposta] = useState<Proposta | null>(null);
  const [draggedColuna, setDraggedColuna] = useState<KanbanColuna | null>(null);
  const [dragOverColunaId, setDragOverColunaId] = useState<string | null>(null);
  const [dragOverColunaOrder, setDragOverColunaOrder] = useState<string | null>(null);

  // Add column dialog
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#3b82f6");

  // Edit column dialog
  const [editingColuna, setEditingColuna] = useState<KanbanColuna | null>(null);
  const [editColumnName, setEditColumnName] = useState("");
  const [editColumnColor, setEditColumnColor] = useState("");

  // Delete column dialog
  const [columnToDelete, setColumnToDelete] = useState<KanbanColuna | null>(null);

  // Filter propostas by search term
  const filteredPropostas = useMemo(() => {
    if (!searchTerm.trim()) return propostas;
    const term = searchTerm.toLowerCase();
    return propostas.filter(
      (p) =>
        p.titulo.toLowerCase().includes(term) ||
        p.cliente_nome?.toLowerCase().includes(term) ||
        p.numero.toString().includes(term)
    );
  }, [propostas, searchTerm]);

  // Get propostas by column
  const getPropostasByColuna = (colunaId: string) => {
    const coluna = colunas.find((c) => c.id === colunaId);
    return filteredPropostas.filter((p) => {
      // First check if proposta has explicit coluna_id
      if ((p as any).coluna_id === colunaId) return true;
      // Fallback to status mapping
      if (coluna?.status_proposta && p.status === coluna.status_proposta) return true;
      return false;
    });
  };

  // Drag handlers for propostas
  const handleDragStart = (e: DragEvent<HTMLDivElement>, proposta: Proposta) => {
    setDraggedProposta(proposta);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedProposta(null);
    setDragOverColunaId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, colunaId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColunaId(colunaId);
  };

  const handleDragLeave = () => {
    setDragOverColunaId(null);
    setDragOverColunaOrder(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetColunaId: string) => {
    e.preventDefault();
    setDragOverColunaId(null);

    if (!draggedProposta) {
      setDraggedProposta(null);
      return;
    }

    const targetColuna = colunas.find((c) => c.id === targetColunaId);
    if (!targetColuna) return;

    const currentColunaId = (draggedProposta as any).coluna_id || 
      colunas.find(c => c.status_proposta === draggedProposta.status)?.id;

    if (currentColunaId === targetColunaId) {
      setDraggedProposta(null);
      return;
    }

    try {
      const updateData: any = {
        coluna_id: targetColunaId,
      };

      // Also update status if column has a mapped status
      if (targetColuna.status_proposta) {
        updateData.status = targetColuna.status_proposta;
      }

      const { error } = await supabase
        .from("tb_propostas")
        .update(updateData)
        .eq("id", draggedProposta.id);

      if (error) throw error;

      // Execute automations
      await executeAutomacoes(
        draggedProposta.id,
        draggedProposta.titulo,
        draggedProposta.cliente_email,
        draggedProposta.cliente_nome,
        currentColunaId,
        targetColunaId
      );

      toast({
        title: "Proposta movida",
        description: `${draggedProposta.titulo} movida para ${targetColuna.nome}`,
      });

      onRefresh();
    } catch (error: any) {
      console.error("Erro ao mover proposta:", error);
      toast({
        title: "Erro ao mover proposta",
        description: error.message,
        variant: "destructive",
      });
    }

    setDraggedProposta(null);
  };

  // Column drag handlers
  const handleColumnDragStart = (e: DragEvent<HTMLDivElement>, coluna: KanbanColuna) => {
    setDraggedColuna(coluna);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("type", "column");
  };

  const handleColumnDragEnd = () => {
    setDraggedColuna(null);
    setDragOverColunaOrder(null);
  };

  const handleColumnDragOver = (e: DragEvent<HTMLDivElement>, colunaId: string) => {
    e.preventDefault();
    if (draggedColuna) {
      e.dataTransfer.dropEffect = "move";
      setDragOverColunaOrder(colunaId);
    }
  };

  const handleColumnDrop = async (e: DragEvent<HTMLDivElement>, targetColunaId: string) => {
    e.preventDefault();
    if (!draggedColuna || draggedColuna.id === targetColunaId) {
      setDraggedColuna(null);
      setDragOverColunaOrder(null);
      return;
    }

    const oldIndex = colunas.findIndex((c) => c.id === draggedColuna.id);
    const newIndex = colunas.findIndex((c) => c.id === targetColunaId);

    const newColunas = [...colunas];
    newColunas.splice(oldIndex, 1);
    newColunas.splice(newIndex, 0, draggedColuna);

    await reorderColunas(newColunas);
    setDraggedColuna(null);
    setDragOverColunaOrder(null);

    toast({
      title: "Colunas reordenadas",
      description: `"${draggedColuna.nome}" foi movida`,
    });
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a coluna",
        variant: "destructive",
      });
      return;
    }

    await createColuna({
      nome: newColumnName.trim(),
      cor: newColumnColor,
    });

    setNewColumnName("");
    setNewColumnColor("#3b82f6");
    setIsAddColumnOpen(false);
  };

  const handleEditColumn = async () => {
    if (!editingColuna || !editColumnName.trim()) return;

    await updateColuna(editingColuna.id, {
      nome: editColumnName.trim(),
      cor: editColumnColor,
    });

    setEditingColuna(null);
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;

    // Move propostas to first column if exists
    const firstColumn = colunas.find((c) => c.id !== columnToDelete.id);
    await deleteColuna(columnToDelete.id, firstColumn?.id);
    setColumnToDelete(null);
    onRefresh();
  };

  const openEditColumn = (coluna: KanbanColuna) => {
    setEditingColuna(coluna);
    setEditColumnName(coluna.nome);
    setEditColumnColor(coluna.cor);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Carregando kanban...
      </div>
    );
  }

  return (
    <>
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onOpenAutomacoes} className="gap-2">
            <Settings className="w-4 h-4" />
            Automações
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAddColumnOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Coluna
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunas.map((coluna) => {
          const colunaPropostas = getPropostasByColuna(coluna.id);
          const isDropTarget = dragOverColunaId === coluna.id;
          const isColumnDropTarget = dragOverColunaOrder === coluna.id && draggedColuna?.id !== coluna.id;

          return (
            <div
              key={coluna.id}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-muted/30 min-h-[500px] min-w-[300px] w-[300px] transition-all flex-shrink-0",
                isDropTarget && "border-primary bg-primary/5",
                isColumnDropTarget && "border-dashed border-2 border-blue-500",
                draggedColuna?.id === coluna.id && "opacity-50 scale-95"
              )}
              onDragOver={(e) => {
                if (draggedColuna) {
                  handleColumnDragOver(e, coluna.id);
                } else {
                  handleDragOver(e, coluna.id);
                }
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                if (draggedColuna) {
                  handleColumnDrop(e, coluna.id);
                } else {
                  handleDrop(e, coluna.id);
                }
              }}
            >
              {/* Column Header */}
              <div
                className="p-3 border-b border-border flex items-center gap-2 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleColumnDragStart(e, coluna)}
                onDragEnd={handleColumnDragEnd}
              >
                <MoveHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: coluna.cor }}
                />
                <h3 className="font-semibold text-foreground truncate">{coluna.nome}</h3>
                <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground flex-shrink-0">
                  {colunaPropostas.length}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditColumn(coluna)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {colunas.length > 1 && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setColumnToDelete(coluna)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colunaPropostas.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma proposta
                  </div>
                ) : (
                  colunaPropostas.map((proposta) => (
                    <Card
                      key={proposta.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, proposta)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
                        draggedProposta?.id === proposta.id && "opacity-50 scale-95"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                #{proposta.numero}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm text-foreground truncate">
                              {proposta.titulo}
                            </p>
                            {proposta.cliente_nome && (
                              <p className="text-xs text-muted-foreground truncate">
                                {proposta.cliente_nome}
                              </p>
                            )}
                            <p className="text-xs font-semibold text-primary mt-1">
                              {proposta.total.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(proposta.created_at), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => onViewProposta(proposta)}
                                title="Ver detalhes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => onEditProposta(proposta)}
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              {proposta.cliente_telefone && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600 hover:text-green-700"
                                  onClick={() => {
                                    const cleanPhone = proposta.cliente_telefone?.replace(/\D/g, "");
                                    window.open(`https://wa.me/55${cleanPhone}`, "_blank");
                                  }}
                                  title="WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {proposta.cliente_email && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    window.open(`mailto:${proposta.cliente_email}`, "_blank")
                                  }
                                  title="Enviar email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Nome da coluna"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newColumnColor === color.id ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.id }}
                    onClick={() => setNewColumnColor(color.id)}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColumnOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddColumn}>Criar Coluna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={!!editingColuna} onOpenChange={() => setEditingColuna(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={editColumnName}
                onChange={(e) => setEditColumnName(e.target.value)}
                placeholder="Nome da coluna"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      editColumnColor === color.id ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.id }}
                    onClick={() => setEditColumnColor(color.id)}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingColuna(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditColumn}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Dialog */}
      <AlertDialog open={!!columnToDelete} onOpenChange={() => setColumnToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna?</AlertDialogTitle>
            <AlertDialogDescription>
              As propostas desta coluna serão movidas para a primeira coluna disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
