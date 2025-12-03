import { useState, useEffect, DragEvent, useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Eye, Phone, Mail, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ViewCustomerDialog } from "./ViewCustomerDialog";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Customer {
  id: number;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  status: string;
  observacoes: string;
  detalhes_cnpj: string | null;
}

interface StatusColumn {
  id: string;
  title: string;
  color: string;
}

const DEFAULT_COLUMNS: StatusColumn[] = [
  { id: "Lead", title: "Lead", color: "bg-blue-500" },
  { id: "Ativo", title: "Ativo", color: "bg-green-500" },
  { id: "Inativo", title: "Inativo", color: "bg-red-500" },
];

const AVAILABLE_COLORS = [
  { id: "bg-blue-500", label: "Azul" },
  { id: "bg-green-500", label: "Verde" },
  { id: "bg-red-500", label: "Vermelho" },
  { id: "bg-yellow-500", label: "Amarelo" },
  { id: "bg-purple-500", label: "Roxo" },
  { id: "bg-pink-500", label: "Rosa" },
  { id: "bg-orange-500", label: "Laranja" },
  { id: "bg-cyan-500", label: "Ciano" },
];

const STORAGE_KEY = "customer_kanban_columns";

export const CustomerKanban = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");
  
  // Columns management
  const [columns, setColumns] = useState<StatusColumn[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });
  
  // Add column dialog
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("bg-blue-500");
  
  // Delete column dialog
  const [columnToDelete, setColumnToDelete] = useState<StatusColumn | null>(null);

  // Save columns to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const fetchCustomers = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    try {
      const { data, error } = await supabase
        .from("tb_clientes")
        .select("id, razao_social, cpf_cnpj, email, telefone, status, observacoes, detalhes_cnpj")
        .eq("dominio", dominio)
        .order("razao_social", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.razao_social.toLowerCase().includes(term) ||
      c.cpf_cnpj.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telefone?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, customer: Customer) => {
    setDraggedCustomer(customer);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedCustomer(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(statusId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedCustomer || draggedCustomer.status === newStatus) {
      setDraggedCustomer(null);
      return;
    }

    // Optimistic update
    setCustomers(prev =>
      prev.map(c =>
        c.id === draggedCustomer.id ? { ...c, status: newStatus } : c
      )
    );

    try {
      const { error } = await supabase
        .from("tb_clientes")
        .update({ status: newStatus })
        .eq("id", draggedCustomer.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `${draggedCustomer.razao_social} movido para ${newStatus}`,
      });
    } catch (error: any) {
      // Revert on error
      fetchCustomers();
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    }

    setDraggedCustomer(null);
  };

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${cleanPhone}`, "_blank");
  };

  const getCustomersByStatus = (status: string) => {
    return filteredCustomers.filter(c => c.status === status);
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a coluna",
        variant: "destructive"
      });
      return;
    }

    const exists = columns.some(c => c.id.toLowerCase() === newColumnTitle.trim().toLowerCase());
    if (exists) {
      toast({
        title: "Erro",
        description: "Já existe uma coluna com esse nome",
        variant: "destructive"
      });
      return;
    }

    const newColumn: StatusColumn = {
      id: newColumnTitle.trim(),
      title: newColumnTitle.trim(),
      color: newColumnColor,
    };

    setColumns(prev => [...prev, newColumn]);
    setNewColumnTitle("");
    setNewColumnColor("bg-blue-500");
    setIsAddColumnOpen(false);

    toast({
      title: "Coluna adicionada",
      description: `Status "${newColumn.title}" criado com sucesso`,
    });
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;

    // Check if there are customers with this status
    const customersInColumn = customers.filter(c => c.status === columnToDelete.id);
    
    if (customersInColumn.length > 0) {
      // Move customers to first column
      const firstColumn = columns[0];
      if (firstColumn && firstColumn.id !== columnToDelete.id) {
        try {
          const dominio = localStorage.getItem("user_dominio");
          const { error } = await supabase
            .from("tb_clientes")
            .update({ status: firstColumn.id })
            .eq("dominio", dominio)
            .eq("status", columnToDelete.id);

          if (error) throw error;
        } catch (error: any) {
          toast({
            title: "Erro ao mover clientes",
            description: error.message,
            variant: "destructive"
          });
          setColumnToDelete(null);
          return;
        }
      }
    }

    setColumns(prev => prev.filter(c => c.id !== columnToDelete.id));
    setColumnToDelete(null);
    fetchCustomers();

    toast({
      title: "Coluna removida",
      description: `Status "${columnToDelete.title}" foi removido`,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Carregando clientes...
      </div>
    );
  }

  return (
    <>
      {/* Search and Add Column */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddColumnOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Coluna
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto">
        {columns.map((column) => {
          const columnCustomers = getCustomersByStatus(column.id);
          const isDropTarget = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-muted/30 min-h-[400px] transition-colors",
                isDropTarget && "border-primary bg-primary/5"
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", column.color)} />
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                  {columnCustomers.length}
                </span>
                {columns.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => setColumnToDelete(column)}
                    title="Remover coluna"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                {columnCustomers.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Nenhum cliente
                  </div>
                ) : (
                  columnCustomers.map((customer) => (
                    <Card
                      key={customer.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, customer)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
                        draggedCustomer?.id === customer.id && "opacity-50 scale-95"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {customer.razao_social}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.cpf_cnpj}
                            </p>
                            
                            {/* Quick Actions */}
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleView(customer)}
                                title="Ver detalhes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {customer.telefone && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600 hover:text-green-700"
                                  onClick={() => openWhatsApp(customer.telefone)}
                                  title="WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {customer.email && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => window.open(`mailto:${customer.email}`, "_blank")}
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

      {/* View Customer Dialog */}
      <ViewCustomerDialog
        customer={viewingCustomer}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Coluna (Status)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Status</label>
              <Input
                placeholder="Ex: Em Negociação"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setNewColumnColor(color.id)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color.id,
                      newColumnColor === color.id && "ring-2 ring-offset-2 ring-primary"
                    )}
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
            <Button onClick={handleAddColumn}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!columnToDelete} onOpenChange={() => setColumnToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover coluna "{columnToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Os clientes nesta coluna serão movidos para a primeira coluna disponível.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
