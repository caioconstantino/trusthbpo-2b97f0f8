import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">TrustHub</div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#plataforma" className="text-sm text-foreground hover:text-primary transition-colors">
              Plataforma
            </a>
            <a href="#solucoes" className="text-sm text-foreground hover:text-primary transition-colors">
              Soluções
            </a>
            <a href="#recursos" className="text-sm text-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#precos" className="text-sm text-foreground hover:text-primary transition-colors">
              Preços
            </a>
            <a href="#contato" className="text-sm text-foreground hover:text-primary transition-colors">
              Contato
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Login
            </Button>
            <Button onClick={() => navigate("/dashboard")}>Teste grátis</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="text-sm font-medium px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary">
                  Planos a partir de R$55
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-primary">Gestão inteligente</span> para vender mais e se preocupar menos
              </h1>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Sistema de gestão</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>HUB de vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Inteligência</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Automações</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <Input 
                  type="email" 
                  placeholder="Insira seu email" 
                  className="flex-1"
                />
                <Button size="lg" className="whitespace-nowrap" onClick={() => navigate("/dashboard")}>
                  Comece o teste de 30 dias grátis
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Teste grátis sem fidelidade
              </p>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">📊</div>
                  <p className="text-lg font-semibold">Dashboard Inteligente</p>
                  <p className="text-sm text-muted-foreground">Gerencie seu negócio em tempo real</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-primary-foreground/20 border-2 border-primary flex items-center justify-center text-xl"
                >
                  👤
                </div>
              ))}
              <div className="w-12 h-12 rounded-full bg-primary-foreground/40 border-2 border-primary flex items-center justify-center text-xl">
                +
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xl md:text-2xl font-semibold">
                +300.000 usuários acessam o TrustHub todos os dias
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gerencie vendas, estoque, finanças e muito mais com nosso sistema completo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🛒",
                title: "Vendas",
                description: "Gerencie pedidos e notas fiscais"
              },
              {
                icon: "📦",
                title: "Estoque",
                description: "Controle produtos e fornecedores"
              },
              {
                icon: "🚚",
                title: "Logística",
                description: "Separe pedidos e envie remessas"
              },
              {
                icon: "💰",
                title: "Gestão financeira",
                description: "Controle contas e acesse serviços"
              },
              {
                icon: "💳",
                title: "Meios de pagamento",
                description: "Links, boletos, PIX e mais"
              },
              {
                icon: "🏦",
                title: "Conta Digital",
                description: "Integre conta digital PJ gratuita"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experimente gratuitamente por 30 dias. Sem cartão de crédito, sem compromisso.
          </p>
          <Button size="lg" onClick={() => navigate("/dashboard")}>
            Começar agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-primary mb-4">TrustHub</div>
              <p className="text-sm text-muted-foreground">
                Sistema completo de gestão empresarial
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Recursos</a></li>
                <li><a href="#" className="hover:text-primary">Preços</a></li>
                <li><a href="#" className="hover:text-primary">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Sobre</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Central de ajuda</a></li>
                <li><a href="#" className="hover:text-primary">Contato</a></li>
                <li><a href="#" className="hover:text-primary">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 TrustHub. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
