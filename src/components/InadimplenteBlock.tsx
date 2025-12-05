import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.webp";

interface InadimplenteBlockProps {
  nomeCliente: string;
  dataVencimento: string;
  plano: string;
}

const InadimplenteBlock = ({ nomeCliente, dataVencimento, plano }: InadimplenteBlockProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRenovar = async () => {
    setLoading(true);
    try {
      // Gerar link de pagamento via Pagar.me
      const priceInCents = plano === 'Pro' ? 9990 : 3990;
      
      const { data, error } = await supabase.functions.invoke('pagarme-create-link', {
        body: {
          planName: `Renovação - Plano ${plano || 'Básico'}`,
          planPrice: priceInCents
        }
      });

      if (error) {
        throw error;
      }

      if (data?.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o link de pagamento.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_dominio");
    localStorage.removeItem("user_nome");
    navigate("/login");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950/20 via-background to-background p-4">
      <Card className="w-full max-w-lg border-destructive/50">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <img src={logo} alt="TrustHBPO Logo" className="h-12 object-contain opacity-50" />
          </div>
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            Acesso Suspenso
          </CardTitle>
          <CardDescription className="text-base">
            Olá, <span className="font-semibold text-foreground">{nomeCliente}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Sua assinatura venceu em</p>
            <p className="text-2xl font-bold text-destructive">{formatDate(dataVencimento)}</p>
          </div>

          <p className="text-center text-muted-foreground">
            Para continuar utilizando o sistema e acessar todos os seus dados, 
            renove sua assinatura agora mesmo.
          </p>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Plano atual</span>
              <span className="font-semibold">{plano || 'Básico'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor mensal</span>
              <span className="font-semibold text-primary">
                {plano === 'Pro' ? 'R$ 99,90' : 'R$ 39,90'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleRenovar}
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Processando...' : 'Renovar Assinatura'}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Precisa de ajuda? Entre em contato com nosso suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InadimplenteBlock;
