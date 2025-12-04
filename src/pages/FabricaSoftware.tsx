import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Code2, 
  Layers, 
  Rocket, 
  Monitor, 
  Handshake, 
  Building2, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Palette,
  Target,
  Sparkles,
  Settings,
  Database,
  Shield,
  Zap,
  Users,
  MessageSquare,
  Clock,
  ChevronRight,
  Quote,
  Star,
  Smartphone,
  Globe,
  Cog
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.webp";

export default function FabricaSoftware() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Floating Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0F172A]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="TrustHBPO Logo" className="h-10 object-contain hover:opacity-80 transition-opacity" />
            <span className="text-white/80 text-sm hidden md:inline">Fábrica de Software</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('servicos')} className="text-sm text-white/70 hover:text-violet-400 transition-colors">
              Serviços
            </button>
            <button onClick={() => scrollToSection('diferenciais')} className="text-sm text-white/70 hover:text-violet-400 transition-colors">
              Diferenciais
            </button>
            <button onClick={() => scrollToSection('processo')} className="text-sm text-white/70 hover:text-violet-400 transition-colors">
              Processo
            </button>
            <button onClick={() => scrollToSection('cases')} className="text-sm text-white/70 hover:text-violet-400 transition-colors">
              Cases
            </button>
          </nav>
          <Button 
            onClick={() => scrollToSection('contato')}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
          >
            Solicitar Orçamento
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-violet-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30 px-4 py-2">
                <Code2 className="w-4 h-4 mr-2" />
                Fábrica de Software TrustHBPO
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Seu sistema{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  personalizado
                </span>
                {" "}do seu jeito
              </h1>

              <p className="text-xl text-white/70 max-w-xl">
                Transformamos o TrustHBPO em uma solução sob medida para sua empresa. 
                Personalizações, integrações e funcionalidades exclusivas para seu negócio.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-bold h-14 px-8 group"
                  onClick={() => scrollToSection('contato')}
                >
                  Quero personalizar meu sistema
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 border-white/30 text-white hover:bg-white/10"
                  onClick={() => scrollToSection('servicos')}
                >
                  Ver serviços
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 border-2 border-[#0F172A] flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  ))}
                </div>
                <div className="text-white/70 text-sm">
                  <span className="text-violet-400 font-bold">+100 projetos</span> entregues com sucesso
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent rounded-3xl blur-3xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                    <Layers className="h-12 w-12 text-violet-400" />
                    <div>
                      <p className="text-white/60 text-sm">Projetos entregues</p>
                      <p className="text-3xl font-bold text-violet-400">+100</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <Clock className="h-8 w-8 text-cyan-400 mb-2" />
                      <p className="text-2xl font-bold text-white">2-4</p>
                      <p className="text-xs text-white/60">Semanas de entrega</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <Shield className="h-8 w-8 text-green-400 mb-2" />
                      <p className="text-2xl font-bold text-white">100%</p>
                      <p className="text-xs text-white/60">Satisfação</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { text: "Customização de módulos", icon: Cog },
                      { text: "Integrações com APIs", icon: Globe },
                      { text: "Relatórios personalizados", icon: Database }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <item.icon className="w-5 h-5 text-violet-400" />
                        <span className="text-white/80 text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-violet-100/50 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">
              <Layers className="w-4 h-4 mr-2" />
              Nossos Serviços
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Soluções{" "}
              <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
                personalizadas
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Transformamos o sistema base em uma ferramenta única para sua empresa, 
              com funcionalidades exclusivas e integrações sob medida.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Palette, title: "Personalização Visual", desc: "Identidade visual da sua marca aplicada ao sistema: cores, logos e layouts personalizados" },
              { icon: Cog, title: "Módulos Exclusivos", desc: "Desenvolvimento de funcionalidades específicas para o seu modelo de negócio" },
              { icon: Globe, title: "Integrações", desc: "Conectamos seu sistema a ERPs, marketplaces, gateways de pagamento e muito mais" },
              { icon: Database, title: "Relatórios Customizados", desc: "Dashboards e relatórios específicos para suas métricas de negócio" },
              { icon: Smartphone, title: "App Mobile", desc: "Versão mobile personalizada para sua equipe acessar em qualquer lugar" },
              { icon: Shield, title: "Segurança Avançada", desc: "Camadas extras de segurança, auditoria e controle de acesso personalizado" }
            ].map((item, i) => (
              <Card key={i} className="group border-slate-200 hover:border-violet-400 transition-all hover:shadow-xl hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section id="diferenciais" className="py-24 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600 rounded-full blur-[200px]" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Por que nos escolher
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Experiência e{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  compromisso
                </span>
                {" "}com resultados
              </h2>

              <div className="space-y-4 text-white/70">
                <p>
                  Nossa fábrica de software conta com anos de experiência no desenvolvimento 
                  e personalização do TrustHBPO para diferentes segmentos de mercado.
                </p>
                <p>
                  Entendemos as necessidades específicas de cada negócio e transformamos 
                  isso em soluções tecnológicas que realmente fazem a diferença no dia a dia.
                </p>
                <p className="text-violet-400 font-semibold">
                  Seu sistema, suas regras, nosso código!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Entrega Rápida", desc: "Projetos entregues em 2 a 4 semanas" },
                { icon: Users, title: "Equipe Dedicada", desc: "Time exclusivo para seu projeto" },
                { icon: MessageSquare, title: "Suporte Contínuo", desc: "Acompanhamento pós-entrega" },
                { icon: Award, title: "Qualidade Garantida", desc: "Código testado e documentado" }
              ].map((item, i) => (
                <Card key={i} className="bg-white/5 border-white/10 hover:border-violet-500/50 transition-all hover:bg-white/10 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardContent className="p-6">
                    <item.icon className="w-10 h-10 text-violet-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Processo */}
      <section id="processo" className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">
              <Target className="w-4 h-4 mr-2" />
              Nosso Processo
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Como{" "}
              <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
                trabalhamos
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Um processo estruturado para garantir que sua personalização seja entregue 
              com qualidade e no prazo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Levantamento", desc: "Entendemos suas necessidades e mapeamos os requisitos do projeto", icon: MessageSquare },
              { step: "02", title: "Proposta", desc: "Apresentamos escopo, prazo e investimento detalhados", icon: Target },
              { step: "03", title: "Desenvolvimento", desc: "Construímos sua solução com sprints semanais e validações", icon: Code2 },
              { step: "04", title: "Entrega", desc: "Implantamos, treinamos sua equipe e oferecemos suporte contínuo", icon: Rocket }
            ].map((item, i) => (
              <div key={i} className="relative group animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-violet-600 to-violet-700 rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
                  {item.step}
                </div>
                <Card className="pt-8 border-slate-200 hover:border-violet-400 transition-all hover:shadow-xl group-hover:-translate-y-2">
                  <CardContent className="p-6">
                    <item.icon className="w-10 h-10 text-violet-600 mb-4" />
                    <h3 className="text-slate-900 font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases / Depoimentos */}
      <section id="cases" className="py-24 bg-[#0F172A]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Star className="w-4 h-4 mr-2" />
              Cases de Sucesso
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              O que nossos{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                clientes dizem
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Carlos Silva",
                role: "CEO - Distribuidora ABC",
                text: "A personalização do sistema transformou nossa operação. Conseguimos integrar com nosso ERP e ter relatórios específicos para nosso segmento.",
                rating: 5
              },
              {
                name: "Marina Santos",
                role: "Diretora - Loja XYZ",
                text: "A equipe entendeu exatamente o que precisávamos. O módulo de comissões que desenvolveram economiza horas de trabalho todo mês.",
                rating: 5
              },
              {
                name: "Roberto Lima",
                role: "Gerente de TI - Grupo 123",
                text: "Profissionais excepcionais. Entregaram no prazo, com qualidade e ainda ofereceram melhorias que não tínhamos pensado.",
                rating: 5
              }
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-white/10 hover:border-violet-500/50 transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-violet-400/30 mb-4" />
                  <p className="text-white/80 mb-6 italic">"{item.text}"</p>
                  <div className="flex items-center gap-1 mb-4">
                    {Array(item.rating).fill(0).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-violet-400 text-violet-400" />
                    ))}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-white/60 text-sm">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contato */}
      <section id="contato" className="py-24 bg-gradient-to-br from-violet-900 via-violet-800 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              <Handshake className="w-4 h-4 mr-2" />
              Vamos conversar
            </Badge>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Pronto para ter um sistema{" "}
              <span className="text-cyan-300">único</span>?
            </h2>
            
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Entre em contato agora e receba uma proposta personalizada para transformar 
              o TrustHBPO na ferramenta perfeita para seu negócio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-violet-900 hover:bg-white/90 font-bold h-14 px-8 group"
                onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre a personalização do sistema TrustHBPO.', '_blank')}
              >
                Falar pelo WhatsApp
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 border-white/30 text-white hover:bg-white/10"
                onClick={() => window.open('mailto:contato@trusthbpo.com.br?subject=Orçamento Personalização', '_blank')}
              >
                Enviar email
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto">
              {[
                { value: "+100", label: "Projetos" },
                { value: "2-4", label: "Semanas" },
                { value: "100%", label: "Satisfação" }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold text-white">{item.value}</p>
                  <p className="text-white/60 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0F172A] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} alt="TrustHBPO Logo" className="h-8 object-contain" />
              <span className="text-white/60 text-sm">Fábrica de Software</span>
            </div>
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} TrustHBPO. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-sm text-white/60 hover:text-violet-400 transition-colors">
                Sistema
              </button>
              <button onClick={() => navigate('/educacao')} className="text-sm text-white/60 hover:text-violet-400 transition-colors">
                Educação
              </button>
              <button onClick={() => navigate('/login')} className="text-sm text-white/60 hover:text-violet-400 transition-colors">
                Entrar
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
