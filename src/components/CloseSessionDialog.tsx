import { useState, useEffect } from "react";
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
import { Switch } from "./ui/switch";
import { EyeOff, Eye, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CloseSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onConfirm: (valorFechamento: number, observacoes: string) => void;
}

interface SessionSummary {
  totalVendas: number;
  totalDinheiro: number;
  totalCredito: number;
  totalDebito: number;
  totalPix: number;
  valorAbertura: number;
  sangrias: number;
}

export const CloseSessionDialog = ({
  open,
  onOpenChange,
  sessionId,
  onConfirm
}: CloseSessionDialogProps) => {
  const [valorFechamento, setValorFechamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [blindMode, setBlindMode] = useState(false);
  const [adminBlindMode, setAdminBlindMode] = useState(false);
  const [summary, setSummary] = useState<SessionSummary>({
    totalVendas: 0,
    totalDinheiro: 0,
    totalCredito: 0,
    totalDebito: 0,
    totalPix: 0,
    valorAbertura: 0,
    sangrias: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sessionId) {
      loadSessionSummary();
      loadAdminSettings();
      setValorFechamento("");
      setObservacoes("");
    }
  }, [open, sessionId]);

  const loadAdminSettings = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    try {
      const { data } = await supabase.functions.invoke("get-customer-data", {
        body: { dominio }
      });

      if (data?.cliente?.fechamento_cego) {
        setAdminBlindMode(true);
        setBlindMode(true);
      } else {
        setAdminBlindMode(false);
      }
    } catch (error) {
      console.error("Error loading admin settings:", error);
    }
  };

  const loadSessionSummary = async () => {
    setLoading(true);
    try {
      // Get session info
      const { data: sessionData } = await supabase
        .from("tb_sessoes_caixa")
        .select("valor_abertura")
        .eq("id", sessionId)
        .single();

      // Get sales for this session
      const { data: vendas } = await supabase
        .from("tb_vendas")
        .select("id, total")
        .eq("sessao_id", sessionId);

      // Get sangrias for this session
      const { data: sangriasData } = await supabase
        .from("tb_sangrias")
        .select("valor")
        .eq("sessao_id", sessionId);

      const totalSangrias = sangriasData?.reduce((sum, s) => sum + Number(s.valor), 0) || 0;

      // Get payments for these sales
      let totalDinheiro = 0;
      let totalCredito = 0;
      let totalDebito = 0;
      let totalPix = 0;

      if (vendas && vendas.length > 0) {
        const vendaIds = vendas.map(v => v.id);
        const { data: pagamentos } = await supabase
          .from("tb_vendas_pagamentos")
          .select("forma_pagamento, valor")
          .in("venda_id", vendaIds);

        if (pagamentos) {
          pagamentos.forEach(p => {
            switch (p.forma_pagamento) {
              case "Dinheiro":
                totalDinheiro += Number(p.valor);
                break;
              case "Crédito":
                totalCredito += Number(p.valor);
                break;
              case "Débito":
                totalDebito += Number(p.valor);
                break;
              case "Pix":
                totalPix += Number(p.valor);
                break;
            }
          });
        }
      }

      const totalVendas = vendas?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

      setSummary({
        totalVendas,
        totalDinheiro,
        totalCredito,
        totalDebito,
        totalPix,
        valorAbertura: Number(sessionData?.valor_abertura) || 0,
        sangrias: totalSangrias
      });
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const expectedCash = summary.valorAbertura + summary.totalDinheiro - summary.sangrias;
  const difference = (parseFloat(valorFechamento) || 0) - expectedCash;

  const handleConfirm = () => {
    const valor = parseFloat(valorFechamento) || 0;
    onConfirm(valor, observacoes);
  };

  const formatHiddenValue = () => "R$ ••••••";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Fechamento de Caixa</DialogTitle>
          <DialogDescription>
            {blindMode 
              ? "Modo às cegas: informe o valor contado sem ver os valores esperados"
              : "Confira os valores e feche a sessão do caixa"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Toggle Blind Mode */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {blindMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-sm font-medium">Fechamento às cegas</span>
              {adminBlindMode && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  (Obrigatório)
                </span>
              )}
            </div>
            <Switch
              checked={blindMode}
              onCheckedChange={setBlindMode}
              disabled={adminBlindMode}
            />
          </div>

          {/* Summary - Hidden in blind mode */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Valor de Abertura:</span>
              <span className="font-medium">
                {blindMode ? formatHiddenValue() : `R$ ${summary.valorAbertura.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="font-medium mb-1">Vendas por Forma de Pagamento:</div>
              <div className="flex justify-between">
                <span>Dinheiro:</span>
                <span>{blindMode ? formatHiddenValue() : `R$ ${summary.totalDinheiro.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Crédito:</span>
                <span>{blindMode ? formatHiddenValue() : `R$ ${summary.totalCredito.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Débito:</span>
                <span>{blindMode ? formatHiddenValue() : `R$ ${summary.totalDebito.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Pix:</span>
                <span>{blindMode ? formatHiddenValue() : `R$ ${summary.totalPix.toFixed(2)}`}</span>
              </div>
            </div>
            {summary.sangrias > 0 && (
              <div className="border-t pt-2 flex justify-between text-orange-600 dark:text-orange-400">
                <span>Sangrias:</span>
                <span>{blindMode ? formatHiddenValue() : `- R$ ${summary.sangrias.toFixed(2)}`}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total de Vendas:</span>
              <span>{blindMode ? formatHiddenValue() : `R$ ${summary.totalVendas.toFixed(2)}`}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-primary">
              <span>Dinheiro Esperado no Caixa:</span>
              <span>{blindMode ? formatHiddenValue() : `R$ ${expectedCash.toFixed(2)}`}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="valorFechamento">Valor Contado no Caixa (R$)</Label>
            <Input
              id="valorFechamento"
              type="number"
              value={valorFechamento}
              onChange={(e) => setValorFechamento(e.target.value)}
              placeholder="0,00"
              className="mt-1 h-10"
              step="0.01"
              min="0"
            />
          </div>

          {/* Difference indicator - Hidden in blind mode */}
          {valorFechamento && !blindMode && (
            <div className={`p-3 rounded-lg text-center font-medium ${
              difference === 0 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                : difference > 0 
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {difference === 0 
                ? "✓ Caixa confere!" 
                : difference > 0 
                  ? `Sobra de R$ ${difference.toFixed(2)}`
                  : `Falta de R$ ${Math.abs(difference).toFixed(2)}`
              }
            </div>
          )}

          {valorFechamento && blindMode && (
            <div className="p-3 rounded-lg text-center font-medium bg-muted">
              <EyeOff className="h-4 w-4 inline mr-2" />
              Valor será conferido após fechamento
            </div>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o fechamento..."
              className="mt-1"
              rows={2}
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
              disabled={loading || !valorFechamento}
            >
              Fechar Caixa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
