import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  Handshake,
  Webhook,
  DollarSign,
  LogOut,
  Monitor,
  Plus,
  Minus,
  ExternalLink,
  Loader2
} from "lucide-react";

const AdminPdvs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quantidade, setQuantidade] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const PRECO_PDV_ADICIONAL = 1000; // R$ 10,00 em centavos

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const incrementQuantidade = () => {
    setQuantidade(prev => prev + 1);
    setPaymentLink(null);
  };

  const decrementQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(prev => prev - 1);
      setPaymentLink(null);
    }
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setQuantidade(value);
      setPaymentLink(null);
    }
  };

  const generatePaymentLink = async () => {
    setIsGenerating(true);
    setPaymentLink(null);

    try {
      const totalCentavos = quantidade * PRECO_PDV_ADICIONAL;
      const planName = quantidade === 1 
        ? "PDV Adicional - TrustHBPO" 
        : `${quantidade}x PDV Adicional - TrustHBPO`;

      const { data, error } = await supabase.functions.invoke("pagarme-create-link", {
        body: {
          planName,
          planPrice: totalCentavos
        }
      });

      if (error) throw error;

      if (data?.paymentLink) {
        setPaymentLink(data.paymentLink);
        toast.success("Link de pagamento gerado com sucesso!");
      } else {
        throw new Error("Link não retornado pela API");
      }
    } catch (error) {
      console.error("Erro ao gerar link:", error);
      toast.error("Erro ao gerar link de pagamento");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const totalReais = (quantidade * PRECO_PDV_ADICIONAL) / 100;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin SaaS</h1>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-6 py-2">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto">
          <Button 
            variant="ghost" 
            className={isActive("/admin") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/clientes") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/clientes")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clientes
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/escolas") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/escolas")}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Escolas
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/alunos") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/alunos")}
          >
            <Users className="w-4 h-4 mr-2" />
            Alunos
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/revendas") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/revendas")}
          >
            <Handshake className="w-4 h-4 mr-2" />
            Revendas
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/pdvs") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/pdvs")}
          >
            <Monitor className="w-4 h-4 mr-2" />
            PDVs
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/webhooks") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/webhooks")}
          >
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/financeiro") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/financeiro")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">PDVs Adicionais</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Informações sobre PDVs
              </CardTitle>
              <CardDescription className="text-slate-400">
                Cada plano inclui 1 PDV por padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-white mb-2">Plano Básico (R$ 39,90/mês)</h4>
                <p className="text-slate-400 text-sm">Inclui 1 PDV</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-white mb-2">Plano Pro (R$ 99,90/mês)</h4>
                <p className="text-slate-400 text-sm">Inclui 1 PDV</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <h4 className="font-semibold text-primary mb-2">PDV Adicional</h4>
                <p className="text-slate-300 text-sm">
                  Cada PDV adicional custa <span className="font-bold text-white">R$ 10,00/mês</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generator Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Gerar Link de Pagamento</CardTitle>
              <CardDescription className="text-slate-400">
                Selecione a quantidade de PDVs adicionais para gerar o link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Quantidade de PDVs Adicionais</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantidade}
                    disabled={quantidade <= 1}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={handleQuantidadeChange}
                    className="w-20 text-center bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantidade}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total mensal:</span>
                  <span className="text-2xl font-bold text-green-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalReais)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {quantidade} PDV{quantidade > 1 ? "s" : ""} adicional{quantidade > 1 ? "is" : ""} × R$ 10,00
                </p>
              </div>

              <Button
                onClick={generatePaymentLink}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando link...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Gerar Link de Pagamento
                  </>
                )}
              </Button>

              {paymentLink && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400 font-medium mb-2">Link gerado com sucesso!</p>
                    <p className="text-xs text-slate-400 break-all">{paymentLink}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Copiar Link
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => window.open(paymentLink, "_blank")}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Link
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPdvs;
