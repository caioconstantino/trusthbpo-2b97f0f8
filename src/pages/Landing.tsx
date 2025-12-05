import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Shield, TrendingUp, Users, BarChart3, Globe, Sparkles, CheckCircle2, Loader2, ShoppingCart, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.webp";

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleContractPlan = async (planName: string, priceInCents: number) => {
    setLoadingPlan(planName);
    try {
      const { data, error } = await supabase.functions.invoke('pagarme-create-link', {
        body: {
          planName,
          planPrice: priceInCents
        }
      });

      if (error) {
        console.error('Error creating payment link:', error);
        toast({
          title: "Erro ao criar link de pagamento",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive"
        });
        return;
      }

      if (data?.paymentLink) {
        // Abre o link de pagamento em uma nova aba
        window.open(data.paymentLink, '_blank');
        toast({
          title: "Link de pagamento criado!",
          description: "Você será redirecionado para finalizar o pagamento"
        });
      } else {
        toast({
          title: "Erro inesperado",
          description: "Não foi possível gerar o link de pagamento",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TrustHBPO Logo" className="h-10 object-contain" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#plataforma" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Plataforma
            </a>
            <a href="#recursos" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#precos" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Preços
            </a>
            <a href="#cases" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Cases
            </a>
            <a href="/educacao" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
              <span>🎓</span> Educação
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
              Login
            </Button>
            <Button onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })} className="group">
              Contratar
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTI4LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-2">
                <Zap className="w-3 h-3 mr-2" />
                Planos a partir de R$55/mês
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Gestão inteligente
                </span>
                <br />
                <span className="text-foreground">para seu negócio crescer</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl">
                Automatize processos, controle estoque, vendas e finanças em uma única plataforma. 
                Simples, rápido e feito para empreendedores.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-xl">
                {[
                  { icon: Shield, text: "100% Seguro" },
                  { icon: Zap, text: "Setup em 5 min" },
                  { icon: Users, text: "+300k usuários" },
                  { icon: TrendingUp, text: "ROI garantido" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:scale-105">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="group text-lg h-14 px-8" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
                  Começar agora
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg h-14 px-8" onClick={() => navigate("/login")}>
                  Já sou cliente
                </Button>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Setup em minutos • Suporte dedicado • Cancele quando quiser
              </p>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas hoje</p>
                      <p className="text-3xl font-bold text-primary">R$ 24.847</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background/50 rounded-xl border border-border">
                      <BarChart3 className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">+127%</p>
                      <p className="text-xs text-muted-foreground">Crescimento</p>
                    </div>
                    <div className="p-4 bg-background/50 rounded-xl border border-border">
                      <Users className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">1.4k</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Pedido #1247", status: "Aprovado", value: "R$ 249,99" },
                      { name: "Pedido #1248", status: "Pendente", value: "R$ 1.299,00" },
                      { name: "Pedido #1249", status: "Enviado", value: "R$ 549,50" }
                    ].map((order, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <div>
                            <p className="text-sm font-medium">{order.name}</p>
                            <p className="text-xs text-muted-foreground">{order.status}</p>
                          </div>
                        </div>
                        <p className="font-semibold">{order.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: "300k+", label: "Usuários ativos", icon: Users },
              { value: "99.9%", label: "Uptime garantido", icon: Shield },
              { value: "R$ 1B+", label: "Processado/ano", icon: TrendingUp },
              { value: "24/7", label: "Suporte premium", icon: Globe }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-3 p-6 rounded-xl hover:bg-card transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <stat.icon className="h-10 w-10 text-primary mx-auto" />
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="recursos" className="py-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-2" />
              Recursos completos
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Tudo que você precisa em{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                um só lugar
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas poderosas para gerenciar vendas, estoque, finanças e muito mais
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto">
            
            {/* Large Feature Card - Vendas */}
            <div className="md:col-span-2 lg:col-span-1 lg:row-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-border hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/30 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700" />
              <div className="relative p-6 lg:p-8 h-full flex flex-col justify-between min-h-[350px] lg:min-h-[450px]">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-500 transition-colors">
                    Vendas Inteligentes
                  </h3>
                  <p className="text-muted-foreground mb-5">
                    Gerencie pedidos, notas fiscais e vendas multicanal em uma única plataforma
                  </p>
                  <ul className="space-y-2">
                    {["PDV completo", "Múltiplos canais", "Notas fiscais automáticas", "Relatórios em tempo real"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-blue-500" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Vendas hoje</span>
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +23%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">R$ 12.458,90</p>
                </div>
              </div>
            </div>

            {/* Card - Estoque */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-border hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
              <div className="relative p-6 h-full min-h-[200px] flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition-colors">Estoque</h3>
                <p className="text-sm text-muted-foreground flex-1">Rastreamento em tempo real com alertas automáticos</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground">75%</span>
                </div>
              </div>
            </div>

            {/* Card - Logística */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-border hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/30 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
              <div className="relative p-6 h-full min-h-[200px] flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-green-500 transition-colors">Logística</h3>
                <p className="text-sm text-muted-foreground flex-1">Entregas rastreadas e etiquetas automáticas</p>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Wide Card - Financeiro */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-border hover:border-amber-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-1/2 w-40 h-40 bg-amber-500/30 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700" />
              <div className="relative p-6 h-full min-h-[200px]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-amber-500 transition-colors">Gestão Financeira</h3>
                    <p className="text-sm text-muted-foreground">Controle completo de contas a pagar e receber</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-500">+45%</p>
                    <p className="text-xs text-muted-foreground">lucro este mês</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 bg-muted rounded-full overflow-hidden h-16 flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-full transition-all duration-500 group-hover:opacity-100 opacity-70"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card - Pagamentos */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent border border-border hover:border-pink-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/10 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 h-full min-h-[200px] flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-pink-500 transition-colors">Pagamentos</h3>
                <p className="text-sm text-muted-foreground flex-1">PIX, cartão, boleto integrados</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <div className="px-3 py-1 rounded-full bg-pink-500/20 text-xs text-pink-500">PIX</div>
                  <div className="px-3 py-1 rounded-full bg-pink-500/20 text-xs text-pink-500">Cartão</div>
                  <div className="px-3 py-1 rounded-full bg-pink-500/20 text-xs text-pink-500">Boleto</div>
                </div>
              </div>
            </div>

            {/* Card - Relatórios */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-border hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 h-full min-h-[200px] flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-500 transition-colors">Relatórios</h3>
                <p className="text-sm text-muted-foreground flex-1">Dashboards e insights em tempo real</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded bg-indigo-500/20" />
                  ))}
                </div>
              </div>
            </div>

            {/* Card Extra - Integrações */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-border hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 h-full min-h-[200px] flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-cyan-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-500 transition-colors">Integrações</h3>
                <p className="text-sm text-muted-foreground flex-1">Conecte com suas ferramentas favoritas</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {['WhatsApp', 'NFe', 'Bancos'].map((name, i) => (
                    <div key={i} className="px-2 py-2 rounded-lg bg-cyan-500/20 text-xs text-cyan-500 text-center font-medium">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Preços transparentes
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Escolha o plano ideal para{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                seu negócio
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sem taxas ocultas. Sem pegadinhas. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Essencial",
                price: "39,90",
                priceInCents: 3990,
                description: "Ideal para pequenos negócios",
                features: [
                  "Até 500 produtos",
                  "1 usuário",
                  "Vendas ilimitadas",
                  "Controle de estoque",
                  "Relatórios básicos",
                  "Suporte por email"
                ],
                popular: false,
                cta: "Contratar plano"
              },
              {
                name: "Profissional",
                price: "99,90",
                priceInCents: 9990,
                description: "Para empresas em crescimento",
                features: [
                  "Produtos ilimitados",
                  "5 usuários",
                  "Vendas ilimitadas",
                  "Controle avançado de estoque",
                  "Relatórios completos",
                  "Multi-lojas",
                  "Contas a pagar/receber",
                  "Suporte prioritário"
                ],
                popular: true,
                cta: "Contratar plano"
              }
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-2 animate-fade-in ${
                  plan.popular
                    ? 'border-primary shadow-xl scale-105'
                    : 'border-border'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredPlan(index)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity ${hoveredPlan === index ? 'opacity-100' : ''}`} />
                
                <CardHeader className="relative">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="relative">
                  <Button
                    className={`w-full group ${plan.popular ? '' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleContractPlan(plan.name, plan.priceInCents)}
                    disabled={loadingPlan === plan.name}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando link...
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Todos os planos incluem 30 dias de teste grátis
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Migração gratuita</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="cases" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Casos de sucesso
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Empresas que{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                confiam na gente
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                company: "Loja Fashion Style",
                author: "Ana Silva",
                role: "CEO",
                content: "Aumentamos nossas vendas em 300% no primeiro ano com o TrustHub. O controle de estoque e as integrações são simplesmente perfeitos!",
                rating: 5
              },
              {
                company: "Tech Solutions LTDA",
                author: "Carlos Mendes",
                role: "Diretor Financeiro",
                content: "A gestão financeira ficou muito mais simples. Economizamos horas por semana e reduzimos erros a zero.",
                rating: 5
              },
              {
                company: "Mercado do Bairro",
                author: "Juliana Costa",
                role: "Proprietária",
                content: "Sistema intuitivo e suporte excepcional. Minha equipe aprendeu a usar em menos de um dia!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="relative overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-500 text-xl">★</span>
                    ))}
                  </div>
                  <CardDescription className="text-base text-foreground">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex-col items-start">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-primary font-medium">{testimonial.company}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground">
              Pronto para transformar sua gestão?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Junte-se a mais de 300 mil empresas que já revolucionaram sua forma de trabalhar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" className="text-lg h-14 px-8 group" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
                Contratar agora
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                Agendar demonstração
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Migração gratuita</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="TrustHBPO Logo" className="h-10 object-contain" />
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Sistema completo de gestão empresarial. Simples, poderoso e feito para você crescer.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                  <Users className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                  <BarChart3 className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Produto</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#recursos" className="hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#precos" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Atualizações</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Empresa</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre nós</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
                <li><a href="#cases" className="hover:text-primary transition-colors">Cases</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Suporte</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Central de ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 TrustHBPO. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
