import { useState, useEffect, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Eye, Phone, Mail, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ViewCustomerDialog } from "./ViewCustomerDialog";
import { cn } from "@/lib/utils";

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

const STATUS_COLUMNS = [
  { id: "Lead", title: "Lead", color: "bg-blue-500" },
  { id: "Ativo", title: "Ativo", color: "bg-green-500" },
  { id: "Inativo", title: "Inativo", color: "bg-red-500" },
];

export const CustomerKanban = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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
    return customers.filter(c => c.status === status);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((column) => {
          const columnCustomers = getCustomersByStatus(column.id);
          const isDropTarget = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-muted/30 min-h-[500px] transition-colors",
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
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
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

      <ViewCustomerDialog
        customer={viewingCustomer}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </>
  );
};
