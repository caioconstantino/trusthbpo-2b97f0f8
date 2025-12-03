import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Check, Plus, Loader2 } from "lucide-react";
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
import { CompletePurchaseDialog } from "@/components/CompletePurchaseDialog";
import { usePurchases, Purchase } from "@/hooks/usePurchases";
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

const Compras = () => {
  const { pendingPurchases, completedPurchases, loading, fetchPurchases, deletePurchase } = usePurchases();

  const [viewingPurchaseId, setViewingPurchaseId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [completingPurchaseId, setCompletingPurchaseId] = useState<string | null>(null);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  const handleView = (id: string) => {
    setViewingPurchaseId(id);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingPurchaseId(id);
    setIsEditDialogOpen(true);
  };

  const handleNewPurchase = () => {
    setEditingPurchaseId(null);
    setIsEditDialogOpen(true);
  };

  const handleComplete = (id: string) => {
    setCompletingPurchaseId(id);
    setIsCompleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingPurchaseId) {
      await deletePurchase(deletingPurchaseId);
      setDeletingPurchaseId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const renderTable = (data: Purchase[], isPending: boolean) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">ID</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-48 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma compra encontrada
              </TableCell>
            </TableRow>
          ) : (
            data.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-mono text-xs">{purchase.id.slice(0, 8)}...</TableCell>
                <TableCell>{purchase.fornecedor || "-"}</TableCell>
                <TableCell>{purchase.unidade}</TableCell>
                <TableCell className="text-right font-medium">
                  R$ {Number(purchase.total).toFixed(2)}
                </TableCell>
                <TableCell className="text-sm">{formatDate(purchase.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {isPending && (
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-green-600 hover:bg-green-700"
                        onClick={() => handleComplete(purchase.id)}
                        title="Concluir compra"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleView(purchase.id)}
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {isPending && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleEdit(purchase.id)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {isPending && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => setDeletingPurchaseId(purchase.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Gestão de Compras</h1>
          <Button onClick={handleNewPurchase}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Compra
          </Button>
        </div>

        {/* Compras Pendentes */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">
            Compras Pendentes ({pendingPurchases.length})
          </h2>
          {renderTable(pendingPurchases, true)}
        </div>

        {/* Compras Concluídas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Compras Concluídas ({completedPurchases.length})
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
        onSave={fetchPurchases}
      />

      <CompletePurchaseDialog
        purchaseId={completingPurchaseId}
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        onComplete={fetchPurchases}
      />

      <AlertDialog open={!!deletingPurchaseId} onOpenChange={() => setDeletingPurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A compra será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Compras;
