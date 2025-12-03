import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Rocket, 
  Monitor, 
  Handshake, 
  Building2, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Heart,
  Target,
  Sparkles,
  BarChart3,
  FileText,
  UserCheck,
  School,
  Briefcase,
  Star,
  Quote,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.webp";

export default function Educacao() {
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
    <div className="min-h-screen bg-[#0A1E3F]">
      {/* Floating CTA */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0A1E3F]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="TrustHBPO Logo" className="h-10 object-contain hover:opacity-80 transition-opacity" />
            <span className="text-white/80 text-sm hidden md:inline">Projeto Social</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('sobre')} className="text-sm text-white/70 hover:text-[#D4AF37] transition-colors">
              Sobre
            </button>
            <button onClick={() => scrollToSection('como-funciona')} className="text-sm text-white/70 hover:text-[#D4AF37] transition-colors">
              Como Funciona
            </button>
            <button onClick={() => scrollToSection('beneficios')} className="text-sm text-white/70 hover:text-[#D4AF37] transition-colors">
              Benefícios
            </button>
            <button onClick={() => scrollToSection('depoimentos')} className="text-sm text-white/70 hover:text-[#D4AF37] transition-colors">
              Depoimentos
            </button>
          </nav>
          <Button 
            onClick={() => scrollToSection('contato')}
            className="bg-[#D4AF37] hover:bg-[#C9A227] text-[#0A1E3F] font-semibold"
          >
            Participar
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1E3F] via-[#0A1E3F] to-[#1a3a6a]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/30 px-4 py-2">
                <Heart className="w-4 h-4 mr-2" />
                Projeto Social TrustHBPO
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Transformando a{" "}
                <span className="text-[#D4AF37]">Educação</span>
                : Gestão Empresarial na Prática
              </h1>

              <p className="text-xl text-white/70 max-w-xl">
                Nosso sistema é doado para escolas e permite que alunos aprendam gestão de verdade, 
                adotando empresas reais durante o curso.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-[#D4AF37] hover:bg-[#C9A227] text-[#0A1E3F] font-bold h-14 px-8 group"
                  onClick={() => scrollToSection('contato')}
                >
                  Quero levar o projeto para minha escola
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 border-white/30 text-white hover:bg-white/10"
                  onClick={() => scrollToSection('como-funciona')}
                >
                  Saiba como funciona
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962F] border-2 border-[#0A1E3F] flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-[#0A1E3F]" />
                    </div>
                  ))}
                </div>
                <div className="text-white/70 text-sm">
                  <span className="text-[#D4AF37] font-bold">+50 escolas</span> já participam do projeto
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent rounded-3xl blur-3xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                    <GraduationCap className="h-12 w-12 text-[#D4AF37]" />
                    <div>
                      <p className="text-white/60 text-sm">Alunos capacitados</p>
                      <p className="text-3xl font-bold text-[#D4AF37]">+2.500</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <School className="h-8 w-8 text-[#D4AF37] mb-2" />
                      <p className="text-2xl font-bold text-white">50+</p>
                      <p className="text-xs text-white/60">Escolas parceiras</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <Briefcase className="h-8 w-8 text-[#D4AF37] mb-2" />
                      <p className="text-2xl font-bold text-white">200+</p>
                      <p className="text-xs text-white/60">Empresas adotadas</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { text: "Gestão financeira completa", icon: BarChart3 },
                      { text: "Controle de estoque", icon: FileText },
                      { text: "Emissão de pedidos", icon: CheckCircle2 }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <item.icon className="w-5 h-5 text-[#D4AF37]" />
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

      {/* Sobre o Sistema */}
      <section id="sobre" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#D4AF37]/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-[#0A1E3F]/10 text-[#0A1E3F] border-[#0A1E3F]/20">
              <Monitor className="w-4 h-4 mr-2" />
              Sobre o Sistema
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0A1E3F] mb-6">
              Um sistema de gestão{" "}
              <span className="text-[#D4AF37]">simples e intuitivo</span>
            </h2>
            <p className="text-xl text-[#0A1E3F]/70 max-w-3xl mx-auto">
              Criado especialmente para quem está começando no mundo empresarial, 
              o TrustHBPO oferece todas as ferramentas essenciais de forma acessível.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "Controle Financeiro", desc: "Gerencie receitas, despesas e fluxo de caixa" },
              { icon: FileText, title: "Emissão de Pedidos", desc: "Crie e acompanhe pedidos de forma simples" },
              { icon: Users, title: "Gestão de Clientes", desc: "Cadastro completo de clientes e fornecedores" },
              { icon: Monitor, title: "Dashboard Intuitivo", desc: "Visualize métricas importantes em tempo real" }
            ].map((item, i) => (
              <Card key={i} className="group border-[#0A1E3F]/10 hover:border-[#D4AF37] transition-all hover:shadow-xl hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962F] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7 text-[#0A1E3F]" />
                  </div>
                  <CardTitle className="text-[#0A1E3F] text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#0A1E3F]/60">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre o Projeto Social */}
      <section className="py-24 bg-[#0A1E3F] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[200px]" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                <Heart className="w-4 h-4 mr-2" />
                Projeto Social
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Um projeto que transforma{" "}
                <span className="text-[#D4AF37]">ensino em experiência real</span>
              </h2>

              <div className="space-y-4 text-white/70">
                <p>
                  O sistema TrustHBPO é doado gratuitamente para escolas técnicas, faculdades e 
                  cursos profissionalizantes que desejam oferecer uma experiência prática de gestão 
                  empresarial aos seus alunos.
                </p>
                <p>
                  Durante o curso, cada aluno ou grupo adota uma empresa real (ou simulada) e 
                  aprende a fazer gestão na prática, com acompanhamento do professor através 
                  de um painel dedicado.
                </p>
                <p className="text-[#D4AF37] font-semibold">
                  Os alunos saem do curso prontos para o mercado de trabalho!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, title: "Aprendizado na prática", desc: "Experiência real com gestão empresarial" },
                { icon: Monitor, title: "Tecnologia moderna", desc: "Sistema atualizado e responsivo" },
                { icon: Handshake, title: "Parceria com instituições", desc: "Apoio total às escolas parceiras" },
                { icon: Rocket, title: "Formação profissional", desc: "Alunos prontos para o mercado" }
              ].map((item, i) => (
                <Card key={i} className="bg-white/5 border-white/10 hover:border-[#D4AF37]/50 transition-all hover:bg-white/10 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardContent className="p-6">
                    <item.icon className="w-10 h-10 text-[#D4AF37] mb-4" />
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-[#0A1E3F]/10 text-[#0A1E3F] border-[#0A1E3F]/20">
              <Target className="w-4 h-4 mr-2" />
              Passo a Passo
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0A1E3F] mb-6">
              Como{" "}
              <span className="text-[#D4AF37]">funciona</span>
            </h2>
            <p className="text-xl text-[#0A1E3F]/70 max-w-3xl mx-auto">
              Um processo simples e estruturado para transformar a educação na sua instituição
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { step: "01", title: "A escola participa do projeto", desc: "Entre em contato e formalize a parceria com o TrustHBPO", icon: School },
              { step: "02", title: "Configuração gratuita", desc: "Configuramos o sistema especialmente para sua instituição", icon: Monitor },
              { step: "03", title: "Alunos recebem acesso", desc: "Cada aluno recebe seu acesso individual ao sistema", icon: UserCheck },
              { step: "04", title: "Grupos adotam empresas", desc: "Cada grupo adota uma empresa real ou simulada", icon: Briefcase },
              { step: "05", title: "Operações de gestão", desc: "Realizam operações reais de gestão empresarial", icon: BarChart3 },
              { step: "06", title: "Acompanhamento em tempo real", desc: "Professor acompanha tudo pelo painel dedicado", icon: Target }
            ].map((item, i) => (
              <div key={i} className="relative group animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#0A1E3F] font-bold text-lg z-10">
                  {item.step}
                </div>
                <Card className="pt-8 border-[#0A1E3F]/10 hover:border-[#D4AF37] transition-all hover:shadow-xl group-hover:-translate-y-2">
                  <CardContent className="p-6">
                    <item.icon className="w-10 h-10 text-[#D4AF37] mb-4" />
                    <h3 className="text-[#0A1E3F] font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-[#0A1E3F]/60">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-24 bg-[#0A1E3F]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Benefícios para a Escola */}
            <div className="space-y-8 animate-fade-in">
              <div>
                <Badge className="mb-4 bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                  <Building2 className="w-4 h-4 mr-2" />
                  Para a Escola
                </Badge>
                <h3 className="text-3xl font-bold text-white mb-4">
                  Benefícios para sua{" "}
                  <span className="text-[#D4AF37]">Instituição</span>
                </h3>
              </div>
              
              <div className="space-y-4">
                {[
                  "Modernização do ensino com tecnologia real",
                  "Alunos com vivência empresarial prática",
                  "Zero custo de uso do sistema",
                  "Plataforma preparada para cursos técnicos",
                  "Diferencial competitivo para a instituição"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                    <CheckCircle2 className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                    <span className="text-white/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefícios para o Aluno */}
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div>
                <Badge className="mb-4 bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Para o Aluno
                </Badge>
                <h3 className="text-3xl font-bold text-white mb-4">
                  Benefícios para o{" "}
                  <span className="text-[#D4AF37]">Aluno</span>
                </h3>
              </div>
              
              <div className="space-y-4">
                {[
                  "Aprendizagem prática e aplicada",
                  "Familiaridade com ferramentas do mercado",
                  "Desenvolvimento de visão gerencial",
                  "Experiência que pode ir para o currículo",
                  "Preparação real para o primeiro emprego"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                    <CheckCircle2 className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                    <span className="text-white/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-[#0A1E3F]/10 text-[#0A1E3F] border-[#0A1E3F]/20">
              <Star className="w-4 h-4 mr-2" />
              Depoimentos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0A1E3F] mb-6">
              O que dizem sobre o{" "}
              <span className="text-[#D4AF37]">projeto</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "O projeto transformou completamente nossa metodologia de ensino. Os alunos agora aprendem gestão de verdade, com um sistema profissional.",
                author: "Prof. Maria Santos",
                role: "Coordenadora de Administração",
                type: "Professor"
              },
              {
                quote: "Quando comecei a usar o sistema na faculdade, percebi que estava aprendendo algo que realmente usaria no mercado de trabalho. Foi um diferencial enorme.",
                author: "João Pedro Silva",
                role: "Ex-aluno, hoje Analista Financeiro",
                type: "Aluno"
              },
              {
                quote: "A parceria com o TrustHBPO trouxe uma nova perspectiva para nossos estagiários. Eles chegam muito mais preparados para os desafios reais.",
                author: "Carlos Mendes",
                role: "Diretor de RH",
                type: "Empresa"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="border-[#0A1E3F]/10 hover:border-[#D4AF37] transition-all hover:shadow-xl animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-6 space-y-4">
                  <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20">
                    {testimonial.type}
                  </Badge>
                  <Quote className="w-8 h-8 text-[#D4AF37]/30" />
                  <p className="text-[#0A1E3F]/70 italic">"{testimonial.quote}"</p>
                  <div className="pt-4 border-t border-[#0A1E3F]/10">
                    <p className="font-semibold text-[#0A1E3F]">{testimonial.author}</p>
                    <p className="text-sm text-[#0A1E3F]/60">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contato" className="py-24 bg-gradient-to-b from-[#0A1E3F] to-[#0d2a52] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[200px]" />
        </div>
        
        <div className="container mx-auto px-4 relative text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Faça parte
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Sua escola pode ser a próxima a{" "}
              <span className="text-[#D4AF37]">transformar o ensino!</span>
            </h2>

            <p className="text-xl text-white/70">
              Estamos buscando parceiros educacionais que queiram oferecer uma experiência 
              prática de gestão aos seus alunos. Entre em contato e saiba como participar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                className="bg-[#D4AF37] hover:bg-[#C9A227] text-[#0A1E3F] font-bold h-16 px-10 text-lg group"
              >
                Quero participar do Projeto Social TrustHBPO
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <p className="text-white/50 text-sm pt-4">
              Entre em contato pelo email: <span className="text-[#D4AF37]">educacao@trusthbpo.com.br</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#071428] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <img src={logo} alt="TrustHBPO Logo" className="h-10 object-contain" />
              <p className="text-white/60 text-sm">
                Transformando a educação através da tecnologia e experiência prática.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('sobre')} className="text-white/60 hover:text-[#D4AF37] text-sm transition-colors">Sobre o Sistema</button></li>
                <li><button onClick={() => scrollToSection('como-funciona')} className="text-white/60 hover:text-[#D4AF37] text-sm transition-colors">Como Funciona</button></li>
                <li><button onClick={() => scrollToSection('beneficios')} className="text-white/60 hover:text-[#D4AF37] text-sm transition-colors">Benefícios</button></li>
                <li><button onClick={() => scrollToSection('depoimentos')} className="text-white/60 hover:text-[#D4AF37] text-sm transition-colors">Depoimentos</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <ul className="space-y-2">
                <li className="text-white/60 text-sm">educacao@trusthbpo.com.br</li>
                <li className="text-white/60 text-sm">(11) 9999-9999</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D4AF37] transition-colors group">
                  <svg className="w-5 h-5 text-white group-hover:text-[#0A1E3F]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D4AF37] transition-colors group">
                  <svg className="w-5 h-5 text-white group-hover:text-[#0A1E3F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D4AF37] transition-colors group">
                  <svg className="w-5 h-5 text-white group-hover:text-[#0A1E3F]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 TrustHBPO. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Termos de Uso</a>
              <a href="#" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
