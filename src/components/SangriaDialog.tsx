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
import { Textarea } from "./ui/textarea";

interface SangriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (valor: number, motivo: string) => void;
}

export const SangriaDialog = ({
  open,
  onOpenChange,
  onConfirm
}: SangriaDialogProps) => {
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValor("");
      setMotivo("");
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open]);

  const handleConfirm = () => {
    const valorNum = parseFloat(valor) || 0;
    if (valorNum <= 0) return;
    onConfirm(valorNum, motivo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sangria de Caixa</DialogTitle>
          <DialogDescription>
            Registre a retirada de dinheiro do caixa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              ref={inputRef}
              id="valor"
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="mt-1 h-10"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da sangria..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!valor || parseFloat(valor) <= 0}
            >
              Confirmar Sangria
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
