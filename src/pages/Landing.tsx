import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Shield, TrendingUp, Users, BarChart3, Globe, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TrustHub
            </span>
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
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="hidden sm:inline-flex">
              Login
            </Button>
            <Button onClick={() => navigate("/dashboard")} className="group">
              Teste grátis
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
                <Button size="lg" className="group text-lg h-14 px-8" onClick={() => navigate("/dashboard")}>
                  Começar teste grátis
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg h-14 px-8" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ver planos
                </Button>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Teste grátis por 30 dias • Sem cartão de crédito • Cancele quando quiser
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

      {/* Features Section */}
      <section id="recursos" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Recursos completos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tudo que você precisa em{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                um só lugar
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas poderosas para gerenciar vendas, estoque, finanças e muito mais com eficiência máxima
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🛒",
                title: "Vendas Inteligentes",
                description: "Gerencie pedidos, notas fiscais e vendas multicanal em um só lugar",
                color: "from-blue-500/10 to-blue-500/5"
              },
              {
                icon: "📦",
                title: "Controle de Estoque",
                description: "Rastreamento em tempo real, alertas automáticos e gestão de fornecedores",
                color: "from-purple-500/10 to-purple-500/5"
              },
              {
                icon: "🚚",
                title: "Logística Integrada",
                description: "Separe pedidos, gere etiquetas e acompanhe entregas automaticamente",
                color: "from-green-500/10 to-green-500/5"
              },
              {
                icon: "💰",
                title: "Gestão Financeira",
                description: "Controle completo de contas a pagar e receber com fluxo de caixa",
                color: "from-yellow-500/10 to-yellow-500/5"
              },
              {
                icon: "💳",
                title: "Pagamentos",
                description: "Aceite PIX, cartão, boleto e links de pagamento integrados",
                color: "from-pink-500/10 to-pink-500/5"
              },
              {
                icon: "📊",
                title: "Relatórios Avançados",
                description: "Dashboards interativos e insights em tempo real para decisões rápidas",
                color: "from-indigo-500/10 to-indigo-500/5"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-border hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-2 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <CardHeader className="relative">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
                <CardFooter className="relative">
                  <Button variant="ghost" size="sm" className="group/btn">
                    Saiba mais
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
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

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "55",
                description: "Perfeito para começar",
                features: [
                  "Até 100 produtos",
                  "1 usuário",
                  "Vendas ilimitadas",
                  "Controle de estoque",
                  "Notas fiscais básicas",
                  "Suporte por email"
                ],
                popular: false,
                cta: "Começar grátis"
              },
              {
                name: "Professional",
                price: "149",
                description: "Mais poder para crescer",
                features: [
                  "Produtos ilimitados",
                  "5 usuários",
                  "Vendas ilimitadas",
                  "Controle avançado",
                  "Notas fiscais completas",
                  "Multi-lojas",
                  "Integrações premium",
                  "Suporte prioritário"
                ],
                popular: true,
                cta: "Começar grátis"
              },
              {
                name: "Enterprise",
                price: "399",
                description: "Solução completa",
                features: [
                  "Tudo do Professional",
                  "Usuários ilimitados",
                  "API personalizada",
                  "Integração ERP",
                  "Gestor de conta dedicado",
                  "Treinamento incluso",
                  "SLA garantido",
                  "Suporte 24/7"
                ],
                popular: false,
                cta: "Falar com vendas"
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
                    onClick={() => navigate("/dashboard")}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              <Button size="lg" variant="secondary" className="text-lg h-14 px-8 group" onClick={() => navigate("/dashboard")}>
                Começar teste grátis agora
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  TrustHub
                </span>
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
              &copy; 2025 TrustHub. Todos os direitos reservados.
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
