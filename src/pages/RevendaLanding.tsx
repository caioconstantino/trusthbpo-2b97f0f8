import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Package,
  Loader2
} from "lucide-react";

interface Revenda {
  id: string;
  nome: string;
  slug: string;
  status: string;
}

interface Produto {
  produto_codigo: string;
  produto_nome: string;
  preco_revenda: number;
  preco_original: number;
}

const RevendaLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revenda, setRevenda] = useState<Revenda | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenda = async () => {
      try {
        // Buscar revenda pelo slug
        const { data: revendaData, error: revendaError } = await supabase
          .from("tb_revendas")
          .select("*")
          .eq("slug", slug)
          .eq("status", "Ativo")
          .single();

        if (revendaError || !revendaData) {
          setError("Revenda não encontrada");
          return;
        }

        setRevenda(revendaData);

        // Buscar produtos da revenda
        const { data: produtosData } = await supabase
          .from("tb_revendas_produtos")
          .select("produto_codigo, produto_nome, preco_revenda, preco_original")
          .eq("revenda_id", revendaData.id)
          .eq("ativo", true);

        setProdutos(produtosData || []);
      } catch (err) {
        setError("Erro ao carregar página");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenda();
  }, [slug]);

  const handleContratarPlano = async (produto: Produto) => {
    if (!revenda) return;
    
    setLoadingCheckout(produto.produto_codigo);
    
    try {
      // Criar link de pagamento via Pagar.me
      const priceInCents = Math.round(produto.preco_revenda * 100);
      
      const { data, error } = await supabase.functions.invoke('pagarme-create-link', {
        body: {
          planName: `${produto.produto_nome} - via ${revenda.nome}`,
          planPrice: priceInCents,
          cupom: revenda.slug,
          revendaId: revenda.id
        }
      });

      if (error) {
        console.error('Error creating payment link:', error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar o link de pagamento. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      if (data?.paymentLink) {
        // Redirecionar para o checkout do Pagar.me
        window.location.href = data.paymentLink;
      } else {
        toast({
          title: "Erro",
          description: "Link de pagamento não foi gerado. Tente novamente.",
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
      setLoadingCheckout(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !revenda) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Página não encontrada</h2>
            <p className="text-slate-400 mb-4">Esta revenda não existe ou está inativa.</p>
            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
              Ir para página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const basicoProduto = produtos.find(p => p.produto_codigo === "basico");
  const proProduto = produtos.find(p => p.produto_codigo === "pro");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TrustHBPO</h1>
              <p className="text-xs text-slate-400">Revenda: {revenda.nome}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Sistema de Gestão Empresarial
            <span className="block text-primary mt-2">Completo e Intuitivo</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Gerencie seu negócio de forma eficiente com PDV, controle de estoque, 
            financeiro e muito mais em uma única plataforma.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">PDV Completo</h3>
              <p className="text-slate-400 text-sm">
                Ponto de venda rápido e fácil de usar com múltiplas formas de pagamento.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Controle Financeiro</h3>
              <p className="text-slate-400 text-sm">
                Gerencie contas a pagar, receber e tenha visão completa do seu fluxo de caixa.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">100% Seguro</h3>
              <p className="text-slate-400 text-sm">
                Seus dados protegidos com criptografia de ponta e backups automáticos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4" id="planos">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Escolha seu Plano
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Plano Básico */}
            <Card className="bg-slate-800 border-slate-700 relative overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Plano Básico</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    R$ {(basicoProduto?.preco_revenda || 49.90).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-slate-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    PDV Completo
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Controle de Estoque
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Cadastro de Clientes
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Relatórios Básicos
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    1 Usuário
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  onClick={() => basicoProduto && handleContratarPlano(basicoProduto)}
                  disabled={loadingCheckout === 'basico'}
                >
                  {loadingCheckout === 'basico' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : 'Contratar Agora'}
                </Button>
              </CardContent>
            </Card>

            {/* Plano Pro */}
            <Card className="bg-gradient-to-b from-primary/20 to-slate-800 border-primary/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                MAIS POPULAR
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Plano Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    R$ {(proProduto?.preco_revenda || 129.90).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-slate-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Tudo do Básico
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Contas a Pagar/Receber
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Central de Contas
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Relatórios Avançados
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Múltiplos Usuários
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    Suporte Prioritário
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6 bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => proProduto && handleContratarPlano(proProduto)}
                  disabled={loadingCheckout === 'pro'}
                >
                  {loadingCheckout === 'pro' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : 'Contratar Agora'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            Revenda autorizada: <span className="text-slate-400">{revenda.nome}</span>
          </p>
          <p className="text-slate-600 text-xs mt-2">
            © {new Date().getFullYear()} TrustHBPO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RevendaLanding;
