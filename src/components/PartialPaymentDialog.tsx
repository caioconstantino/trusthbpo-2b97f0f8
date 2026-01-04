import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valorTotal: number;
  valorPago: number;
  tipo: "pagar" | "receber";
  onConfirm: (valor: number) => void;
}

export const PartialPaymentDialog = ({
  open,
  onOpenChange,
  valorTotal,
  valorPago,
  tipo,
  onConfirm,
}: PartialPaymentDialogProps) => {
  const valorRestante = valorTotal - valorPago;
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (open) {
      setValor(valorRestante.toFixed(2));
    }
  }, [open, valorRestante]);

  const handleConfirm = () => {
    const valorNumero = parseFloat(valor);
    if (isNaN(valorNumero) || valorNumero <= 0) return;
    onConfirm(valorNumero);
  };

  const handlePayFull = () => {
    onConfirm(valorRestante);
  };

  const progresso = valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tipo === "pagar" ? "Registrar Pagamento" : "Registrar Recebimento"}
          </DialogTitle>
          <DialogDescription>
            Informe o valor {tipo === "pagar" ? "pago" : "recebido"}. Você pode fazer {tipo === "pagar" ? "pagamentos" : "recebimentos"} parciais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progresso.toFixed(0)}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {tipo === "pagar" ? "Pago" : "Recebido"}: R$ {valorPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span>Total: R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Remaining amount */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Valor Restante</p>
            <p className="text-xl font-bold text-amber-600">
              R$ {valorRestante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Input value */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor a {tipo === "pagar" ? "pagar" : "receber"}</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              max={valorRestante}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleConfirm}
            disabled={!valor || parseFloat(valor) <= 0 || parseFloat(valor) > valorRestante}
          >
            {tipo === "pagar" ? "Pagar Parcial" : "Receber Parcial"}
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handlePayFull}
          >
            {tipo === "pagar" ? "Pagar Total" : "Receber Total"} (R$ {valorRestante.toFixed(2)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
