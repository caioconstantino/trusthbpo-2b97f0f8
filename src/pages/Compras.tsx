import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ViewPurchaseDialog } from "@/components/ViewPurchaseDialog";
import { EditPurchaseDialog } from "@/components/EditPurchaseDialog";

interface Purchase {
  id: number;
  store: string;
  createdAt: string;
  status: "pending" | "completed";
}

const Compras = () => {
  const [purchases] = useState<Purchase[]>([
    { id: 52, store: "Matriz", createdAt: "2025-07-08 13:41:43", status: "pending" },
    { id: 53, store: "Matriz", createdAt: "2025-07-08 13:47:25", status: "pending" },
    { id: 100, store: "Matriz", createdAt: "2025-10-10 14:07:39", status: "completed" },
  ]);

  const [viewingPurchaseId, setViewingPurchaseId] = useState<number | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const pendingPurchases = purchases.filter(p => p.status === "pending");
  const completedPurchases = purchases.filter(p => p.status === "completed");

  const handleView = (id: number) => {
    setViewingPurchaseId(id);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingPurchaseId(id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    console.log("Deletar compra:", id);
  };

  const handleComplete = (id: number) => {
    console.log("Concluir compra:", id);
  };

  const renderTable = (data: Purchase[], showCompleteButton: boolean = false) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">ID</TableHead>
            <TableHead>Produtos</TableHead>
            <TableHead>Loja</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead className="w-48 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell className="font-medium">{purchase.id}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleView(purchase.id)}
                >
                  Ver Produtos
                </Button>
              </TableCell>
              <TableCell>{purchase.store}</TableCell>
              <TableCell>{purchase.createdAt}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {showCompleteButton && (
                    <Button
                      size="icon"
                      className="h-9 w-9 bg-secondary hover:bg-secondary/90"
                      onClick={() => handleComplete(purchase.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 bg-slate-700 hover:bg-slate-800 text-white"
                    onClick={() => handleView(purchase.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 bg-slate-600 hover:bg-slate-700 text-white"
                    onClick={() => handleEdit(purchase.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-9 w-9"
                    onClick={() => handleDelete(purchase.id)}
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
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Compras</h1>

        {/* Compras Pendentes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary underline">
            Compras Pendentes
          </h2>
          {renderTable(pendingPurchases, true)}
        </div>

        {/* Compras Concluídas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary underline">
            Compras Concluídas
          </h2>
          {renderTable(completedPurchases, false)}
        </div>
      </div>

      {/* Modais */}
      <ViewPurchaseDialog
        purchaseId={viewingPurchaseId}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <EditPurchaseDialog
        purchaseId={editingPurchaseId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </DashboardLayout>
  );
};

export default Compras;
