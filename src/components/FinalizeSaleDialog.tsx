import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Payment {
  id: string;
  type: string;
  method: string;
  value: number;
}

interface FinalizeSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  total: number;
  onComplete: () => void;
}

export const FinalizeSaleDialog = ({
  open,
  onOpenChange,
  cartItems,
  total,
  onComplete
}: FinalizeSaleDialogProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("Dinheiro");
  const [discount, setDiscount] = useState(0);
  const [addition, setAddition] = useState(0);
  const [paymentValue, setPaymentValue] = useState("");
  const paymentInputRef = useRef<HTMLInputElement>(null);

  const subtotal = total;
  const discountValue = (subtotal * discount) / 100;
  const additionValue = (subtotal * addition) / 100;
  const finalTotal = subtotal - discountValue + additionValue;
  const totalPaid = payments.reduce((sum, p) => sum + p.value, 0);
  const change = Math.max(0, totalPaid - finalTotal);
  const remaining = Math.max(0, finalTotal - totalPaid);

  const paymentMethods = [
    { name: "Crédito", shortcut: "F1" },
    { name: "Débito", shortcut: "F2" },
    { name: "Dinheiro", shortcut: "F3" },
    { name: "Pix", shortcut: "F4" }
  ];

  // Set default payment value to remaining when dialog opens or remaining changes
  useEffect(() => {
    if (open && remaining > 0) {
      setPaymentValue(remaining.toFixed(2));
    }
  }, [open, remaining]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPayments([]);
      setDiscount(0);
      setAddition(0);
      setPaymentValue("");
      setSelectedMethod("Dinheiro");
    }
  }, [open]);

  const selectPaymentMethod = (methodName: string) => {
    setSelectedMethod(methodName);
    setPaymentValue(remaining.toFixed(2));
    
    // Focus and select the input
    setTimeout(() => {
      if (paymentInputRef.current) {
        paymentInputRef.current.focus();
        paymentInputRef.current.select();
      }
    }, 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        selectPaymentMethod("Crédito");
      } else if (e.key === "F2") {
        e.preventDefault();
        selectPaymentMethod("Débito");
      } else if (e.key === "F3") {
        e.preventDefault();
        selectPaymentMethod("Dinheiro");
      } else if (e.key === "F4") {
        e.preventDefault();
        selectPaymentMethod("Pix");
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, remaining]);

  const addPayment = () => {
    const value = parseFloat(paymentValue);
    if (!value || value <= 0) return;

    const newPayment: Payment = {
      id: Date.now().toString(),
      type: "PAGAMENTO",
      method: selectedMethod,
      value: value
    };

    setPayments([...payments, newPayment]);
    
    // Calculate new remaining after this payment
    const newTotalPaid = totalPaid + value;
    const newRemaining = Math.max(0, finalTotal - newTotalPaid);
    setPaymentValue(newRemaining > 0 ? newRemaining.toFixed(2) : "");
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleFinalizeSale = () => {
    if (remaining > 0) {
      toast({
        title: "Pagamento incompleto",
        description: `Falta pagar R$ ${remaining.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Venda finalizada!",
      description: `Total: R$ ${finalTotal.toFixed(2)} | Troco: R$ ${change.toFixed(2)}`,
    });

    onComplete();
  };

  const handleCancel = () => {
    setPayments([]);
    setDiscount(0);
    setAddition(0);
    setPaymentValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mt-4">
          {/* Left Side - Payments Table */}
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TIPO</TableHead>
                    <TableHead>FORMA DE PAGAMENTO</TableHead>
                    <TableHead>VALOR</TableHead>
                    <TableHead className="w-20">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum pagamento adicionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>
                          R$ {payment.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => removePayment(payment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Discount and Addition */}
            <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
              <div>
                <Label>Desconto %</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label>Acréscimo %</Label>
                <Input
                  type="number"
                  value={addition}
                  onChange={(e) => setAddition(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal: R$ {subtotal.toFixed(2)}</span>
                <span>Desconto: R$ {discountValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Acréscimo: R$ {additionValue.toFixed(2)}</span>
                <span>Total Pago: R$ {totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total: R$ {finalTotal.toFixed(2)}</span>
                <span className={change > 0 ? "text-green-600" : ""}>
                  Troco: R$ {change.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="destructive"
                onClick={handleCancel}
                className="h-14 text-lg"
              >
                Cancelar - ESC
              </Button>
              <Button
                size="lg"
                className="h-14 text-lg"
                onClick={handleFinalizeSale}
                disabled={remaining > 0}
              >
                Finalizar Venda
              </Button>
            </div>
          </div>

          {/* Right Side - Payment Methods */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.name}
                  variant={selectedMethod === method.name ? "default" : "secondary"}
                  className="h-16 text-lg flex flex-col gap-1"
                  onClick={() => selectPaymentMethod(method.name)}
                >
                  <span>{method.name}</span>
                  <span className="text-xs opacity-70">{method.shortcut}</span>
                </Button>
              ))}
            </div>

            <div>
              <Label>Valor Pago</Label>
              <Input
                ref={paymentInputRef}
                type="number"
                value={paymentValue}
                onChange={(e) => setPaymentValue(e.target.value)}
                placeholder="0,00"
                className="mt-1 text-lg h-12"
                step="0.01"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addPayment();
                  }
                }}
              />
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={addPayment}
            >
              Adicionar Pagamento
            </Button>

            {remaining > 0 && (
              <div className="text-center text-destructive font-semibold text-lg p-3 bg-destructive/10 rounded-lg">
                Falta: R$ {remaining.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
