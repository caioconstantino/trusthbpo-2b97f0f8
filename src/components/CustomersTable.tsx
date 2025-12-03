import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { EditCustomerSheet } from "./EditCustomerSheet";
import { ViewCustomerDialog } from "./ViewCustomerDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  status: string;
  observacoes: string;
}

export const CustomersTable = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchCustomers = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    try {
      const { data, error } = await supabase
        .from("tb_clientes")
        .select("id, razao_social, cpf_cnpj, email, telefone, status, observacoes")
        .eq("dominio", dominio)
        .order("id", { ascending: false });

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

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const { error } = await supabase
        .from("tb_clientes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      });

      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Carregando clientes...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Nenhum cliente cadastrado.
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">#</TableHead>
              <TableHead>Nome / Razão Social</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.id}</TableCell>
                <TableCell>{customer.razao_social}</TableCell>
                <TableCell>{customer.cpf_cnpj}</TableCell>
                <TableCell>{customer.telefone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.status === "Ativo" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {customer.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-slate-700 hover:bg-slate-800 text-white"
                      onClick={() => handleView(customer)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleEdit(customer)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditCustomerSheet
        customer={editingCustomer}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSuccess={fetchCustomers}
      />

      <ViewCustomerDialog
        customer={viewingCustomer}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </>
  );
};
