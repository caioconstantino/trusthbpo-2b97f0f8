import { useState } from "react";
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

interface Customer {
  id: string;
  number: number;
  socialName: string;
  responsible: string;
  status: string;
}

export const CustomersTable = () => {
  const [customers] = useState<Customer[]>([
    {
      id: "1",
      number: 271,
      socialName: "Jorge Varejo",
      responsible: "Jorges Guedes",
      status: "Ativo"
    },
    {
      id: "2",
      number: 286,
      socialName: "",
      responsible: "",
      status: "Ativo"
    }
  ]);

  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleView = (id: string) => {
    setViewingCustomerId(id);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingCustomerId(id);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Deletar cliente:", id);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">#</TableHead>
              <TableHead>R. Social</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.number}</TableCell>
                <TableCell>{customer.socialName}</TableCell>
                <TableCell>{customer.responsible}</TableCell>
                <TableCell>{customer.status}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-slate-700 hover:bg-slate-800 text-white"
                      onClick={() => handleView(customer.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleEdit(customer.id)}
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
        customerId={editingCustomerId}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
      />

      <ViewCustomerDialog
        customerId={viewingCustomerId}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </>
  );
};
