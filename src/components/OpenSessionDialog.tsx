import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface OpenSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (valorAbertura: number, caixaNome: string) => void;
}

export const OpenSessionDialog = ({
  open,
  onOpenChange,
  onConfirm
}: OpenSessionDialogProps) => {
  const [valorAbertura, setValorAbertura] = useState("");
  const [caixaNome, setCaixaNome] = useState("Caixa 1");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open]);

  const handleConfirm = () => {
    const valor = parseFloat(valorAbertura) || 0;
    onConfirm(valor, caixaNome);
    setValorAbertura("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Abertura de Caixa</DialogTitle>
          <DialogDescription>
            Informe o valor em dinheiro para iniciar a sessão do caixa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="caixaNome">Nome do Caixa</Label>
            <Input
              id="caixaNome"
              value={caixaNome}
              onChange={(e) => setCaixaNome(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="valorAbertura">Valor de Abertura (R$)</Label>
            <Input
              ref={inputRef}
              id="valorAbertura"
              type="number"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0,00"
              className="mt-1 text-lg h-12"
              step="0.01"
              min="0"
            />
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={handleConfirm}
          >
            Abrir Caixa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
