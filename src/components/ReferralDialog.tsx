import { useState, useEffect } from "react";
import { Gift, Copy, Check, Wallet, History, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralConfig {
  id: string;
  dominio: string;
  codigo: string;
  link_slug: string;
  saldo: number;
  total_ganho: number;
  total_sacado: number;
}

interface Referral {
  id: string;
  indicado_nome: string;
  indicado_email: string | null;
  valor_comissao: number;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  valor: number;
  status: string;
  chave_pix: string | null;
  tipo_chave_pix: string | null;
  created_at: string;
  data_processamento: string | null;
}

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferralDialog = ({ open, onOpenChange }: ReferralDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Withdrawal form
  const [withdrawValue, setWithdrawValue] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const dominio = localStorage.getItem("user_dominio");
  const baseUrl = window.location.origin;

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateSlug = (dominio: string) => {
    return `${dominio.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
  };

  const fetchData = async () => {
    if (!dominio) return;
    
    setLoading(true);
    try {
      // Fetch or create config
      let { data: configData, error: configError } = await supabase
        .from("tb_indicacoes_config")
        .select("*")
        .eq("dominio", dominio)
        .maybeSingle();

      if (configError) throw configError;

      if (!configData) {
        // Create new config
        const newConfig = {
          dominio,
          codigo: generateCode(),
          link_slug: generateSlug(dominio),
          saldo: 0,
          total_ganho: 0,
          total_sacado: 0,
        };

        const { data: inserted, error: insertError } = await supabase
          .from("tb_indicacoes_config")
          .insert(newConfig)
          .select()
          .single();

        if (insertError) throw insertError;
        configData = inserted;
      }

      setConfig(configData as ReferralConfig);

      // Fetch referrals
      const { data: referralsData } = await supabase
        .from("tb_indicacoes")
        .select("*")
        .eq("indicador_dominio", dominio)
        .order("created_at", { ascending: false });

      setReferrals((referralsData as Referral[]) || []);

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from("tb_saques")
        .select("*")
        .eq("dominio", dominio)
        .order("created_at", { ascending: false });

      setWithdrawals((withdrawalsData as Withdrawal[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast({
      title: "Copiado!",
      description: type === "code" ? "Código copiado" : "Link copiado",
    });
  };

  const handleWithdraw = async () => {
    if (!config) return;
    
    const valor = parseFloat(withdrawValue);
    if (!valor || valor <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para saque",
        variant: "destructive",
      });
      return;
    }

    if (valor > config.saldo) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para este saque",
        variant: "destructive",
      });
      return;
    }

    if (!pixKey || !pixKeyType) {
      toast({
        title: "Dados incompletos",
        description: "Preencha a chave PIX e o tipo",
        variant: "destructive",
      });
      return;
    }

    setSubmittingWithdraw(true);
    try {
      // Create withdrawal request
      const { error: withdrawError } = await supabase
        .from("tb_saques")
        .insert({
          dominio,
          valor,
          chave_pix: pixKey,
          tipo_chave_pix: pixKeyType,
        });

      if (withdrawError) throw withdrawError;

      // Update balance
      const { error: updateError } = await supabase
        .from("tb_indicacoes_config")
        .update({
          saldo: config.saldo - valor,
          total_sacado: config.total_sacado + valor,
        })
        .eq("id", config.id);

      if (updateError) throw updateError;

      toast({
        title: "Saque solicitado",
        description: "Sua solicitação de saque foi enviada com sucesso",
      });

      setWithdrawValue("");
      setPixKey("");
      setPixKeyType("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "aprovado":
      case "pago":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Indique e Ganhe
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="share" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="share">Compartilhar</TabsTrigger>
              <TabsTrigger value="balance">Saldo</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* Share Tab */}
            <TabsContent value="share" className="space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Ganhe <span className="font-bold text-primary">10%</span> de comissão
                </p>
                <p className="text-xs text-muted-foreground">
                  sobre cada assinatura dos seus indicados
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Seu código de indicação</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={config?.codigo || ""}
                      readOnly
                      className="font-mono text-lg font-bold tracking-wider"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config?.codigo || "", "code")}
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Seu link de indicação</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={`${baseUrl}/?ref=${config?.link_slug || ""}`}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(`${baseUrl}/?ref=${config?.link_slug || ""}`, "link")
                      }
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Como funciona:</strong> Compartilhe seu código ou link com amigos. 
                  Quando eles assinarem, você recebe 10% do valor da assinatura como comissão!
                </p>
              </div>
            </TabsContent>

            {/* Balance Tab */}
            <TabsContent value="balance" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Saldo Atual</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(config?.saldo || 0)}
                  </p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Ganho</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(config?.total_ganho || 0)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Sacado</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(config?.total_sacado || 0)}
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Solicitar Saque
                </h4>

                <div>
                  <Label className="text-xs">Valor do saque</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={withdrawValue}
                    onChange={(e) => setWithdrawValue(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tipo de Chave PIX</Label>
                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Chave PIX</Label>
                    <Input
                      placeholder="Sua chave PIX"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={submittingWithdraw || !config?.saldo}
                  className="w-full"
                >
                  {submittingWithdraw ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Solicitar Saque
                </Button>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <History className="w-4 h-4" />
                  Minhas Indicações
                </h4>
                {referrals.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhuma indicação ainda
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {referrals.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{ref.indicado_nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(ref.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-600">
                            +{formatCurrency(ref.valor_comissao)}
                          </p>
                          {getStatusBadge(ref.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4" />
                  Histórico de Saques
                </h4>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhum saque solicitado
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {formatCurrency(w.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(w.created_at)}
                          </p>
                        </div>
                        {getStatusBadge(w.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
