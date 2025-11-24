import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { MessageCircle, Phone } from "lucide-react";

interface ViewCustomerDialogProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewCustomerDialog = ({ customerId, open, onOpenChange }: ViewCustomerDialogProps) => {
  const customerData = {
    responsible: "Jorges Guedes",
    status: "Ativo",
    socialName: "Jorge Varejo",
    cpfCnpj: "12.345.678/0001-23",
    email: "jorgeguedes@gmail.com",
    phone: "1298817002",
    observations: "Sem observacoes.",
    socialCapital: "N/A",
    size: "N/A",
    legalNature: "N/A",
    partners: "N/A",
    simples: "N/A"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Detalhes */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg mb-3">Detalhes:</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-muted-foreground">Responsavel:</span>{" "}
                {customerData.responsible}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Status:</span>{" "}
                {customerData.status}
              </p>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg mb-3">Dados do Cliente</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-muted-foreground">Razão Social:</span>{" "}
                {customerData.socialName}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">CPF/CNPJ:</span>{" "}
                {customerData.cpfCnpj}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Email:</span>{" "}
                {customerData.email}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Telefone:</span>
                <span>{customerData.phone}</span>
                <div className="flex gap-1 ml-2">
                  <Button size="icon" variant="secondary" className="h-7 w-7 bg-slate-700 hover:bg-slate-800 text-white">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-7 w-7 bg-sky-500 hover:bg-sky-600 text-white">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg mb-3">Observações:</h3>
            <p className="text-sm text-muted-foreground">{customerData.observations}</p>
          </div>

          {/* Mais Detalhes */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg mb-3">Mais Detalhes:</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-muted-foreground">Capital Social:</span>{" "}
                {customerData.socialCapital}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Porte:</span>{" "}
                {customerData.size}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Natureza Jurídica:</span>{" "}
                {customerData.legalNature}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Socios:</span>{" "}
                {customerData.partners}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Simples:</span>{" "}
                {customerData.simples}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
