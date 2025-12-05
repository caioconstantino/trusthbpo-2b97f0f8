import { useState } from "react";
import { AlertTriangle, Package, Plus, Minus, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductLimitAlertProps {
  totalProdutos: number;
  limiteTotal: number;
  produtosAdicionais: number;
  isBasico: boolean;
  podecadastrar: boolean;
  onUpdate: () => void;
}

const PRECO_PACOTE_PRODUTOS = 20;

export const ProductLimitAlert = ({
  totalProdutos,
  limiteTotal,
  produtosAdicionais,
  isBasico,
  podecadastrar,
  onUpdate,
}: ProductLimitAlertProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [quantidade, setQuantidade] = useState(produtosAdicionais);
  const [isSaving, setIsSaving] = useState(false);

  // Don't show anything for Pro plan or if can still register
  if (!isBasico) return null;

  const percentUsed = Math.min((totalProdutos / limiteTotal) * 100, 100);
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = !podecadastrar;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dominio = localStorage.getItem("user_dominio");
      const { error } = await supabase.functions.invoke("get-customer-data", {
        body: {
          dominio,
          action: "update_produtos",
          produtos_adicionais: quantidade,
        },
      });
      if (error) throw error;
      toast({
        title: "Salvo!",
        description: `Limite de produtos atualizado. Será cobrado na próxima fatura.`,
      });
      setShowDialog(false);
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <>
      <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {isAtLimit ? "Limite de produtos atingido" : "Próximo do limite de produtos"}
        </AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p>
              Você está utilizando <strong>{totalProdutos}</strong> de{" "}
              <strong>{limiteTotal}</strong> produtos ({percentUsed.toFixed(0)}%).
            </p>
            {isAtLimit && (
              <p className="text-sm mt-1">
                Contrate mais produtos para continuar cadastrando.
              </p>
            )}
          </div>
          <Button
            variant={isAtLimit ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDialog(true)}
            className="whitespace-nowrap"
          >
            <Package className="w-4 h-4 mr-2" />
            Contratar +500 produtos
          </Button>
        </AlertDescription>
      </Alert>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contratar Produtos Adicionais</DialogTitle>
            <DialogDescription>
              Cada pacote adiciona 500 produtos ao seu limite e custa R$ 20,00/mês.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Limite base</p>
                  <p className="font-semibold">500 produtos</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pacotes contratados</p>
                  <p className="font-semibold">{produtosAdicionais} pacote(s)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Produtos utilizados</p>
                  <p className="font-semibold">{totalProdutos}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Limite atual</p>
                  <p className="font-semibold">{limiteTotal} produtos</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de Pacotes (+500 produtos cada)</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => quantidade > 0 && setQuantidade(quantidade - 1)}
                  disabled={quantidade <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={quantidade}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setQuantidade(value);
                    }
                  }}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantidade(quantidade + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Novo limite</p>
                  <p className="text-sm text-muted-foreground">
                    500 + ({quantidade} × 500) = {500 + quantidade * 500} produtos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor mensal</p>
                  <p className="text-xl font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(quantidade * PRECO_PACOTE_PRODUTOS)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              O valor será adicionado à sua próxima fatura automaticamente.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || quantidade === produtosAdicionais}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
