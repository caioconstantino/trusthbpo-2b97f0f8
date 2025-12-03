import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { MessageCircle, Phone } from "lucide-react";

interface Customer {
  id: number;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  status: string;
  observacoes: string;
}

interface ViewCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewCustomerDialog = ({ customer, open, onOpenChange }: ViewCustomerDialogProps) => {
  if (!customer) return null;

  const openWhatsApp = () => {
    const phone = customer.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  const openPhone = () => {
    window.open(`tel:${customer.telefone}`, "_self");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              customer.status === "Ativo" 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {customer.status}
            </span>
          </div>

          {/* Dados do Cliente */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg mb-3">Dados do Cliente</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-muted-foreground">Razão Social:</span>{" "}
                {customer.razao_social}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">CPF/CNPJ:</span>{" "}
                {customer.cpf_cnpj || "Não informado"}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Email:</span>{" "}
                {customer.email || "Não informado"}
              </p>
              {customer.telefone && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Telefone:</span>
                  <span>{customer.telefone}</span>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white"
                      onClick={openWhatsApp}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-7 w-7 bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={openPhone}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {customer.observacoes && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-lg mb-3">Observações:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.observacoes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
