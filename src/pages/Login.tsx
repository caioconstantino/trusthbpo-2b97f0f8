import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, Lock, Building, MapPin } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import InadimplenteBlock from "@/components/InadimplenteBlock";
import logo from "@/assets/logo.webp";

interface Unidade {
  id: number;
  nome: string;
  endereco_cidade: string | null;
  endereco_estado: string | null;
}

const Login = () => {
  const [step, setStep] = useState<"domain" | "credentials" | "selectUnidade" | "blocked">("domain");
  const [dominio, setDominio] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [blockedData, setBlockedData] = useState<{
    dataVencimento: string;
    plano: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Limpar sessão expirada ao carregar a página de login
  useEffect(() => {
    const clearExpiredSession = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem("unidade_ativa_id");
    };
    clearExpiredSession();
  }, []);

  const validarDominio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("validar_dominio", {
        p_dominio: dominio.trim().toLowerCase(),
      });

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        const resultado = data[0];
        if (resultado.existe === true) {
          setNomeCliente(resultado.nome_cliente);
          setStep("credentials");
          toast({
            title: "Sucesso",
            description: `Bem-vindo, ${resultado.nome_cliente}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Credenciais inválidas",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Credenciais inválidas",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (authError) throw authError;

      // Verificar se o usuário pertence ao domínio
      const { data: userData, error: userError } = await supabase
        .from("tb_usuarios")
        .select("*, unidades_acesso")
        .eq("auth_user_id", authData.user.id)
        .eq("dominio", dominio)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        throw new Error("Credenciais inválidas");
      }

      // Verificar status de inadimplência do cliente
      const { data: clienteData } = await supabase
        .from("tb_clientes_saas")
        .select("status, proximo_pagamento, plano, tipo_conta")
        .eq("dominio", dominio.trim().toLowerCase())
        .single();

      if (clienteData) {
        // Verificar se é conta de aluno (não bloqueia)
        const isAluno = clienteData.tipo_conta === 'aluno';
        
        // Verificar se está inadimplente (proximo_pagamento no passado)
        const hoje = new Date();
        const proximoPagamento = clienteData.proximo_pagamento ? new Date(clienteData.proximo_pagamento) : null;
        const isInadimplente = proximoPagamento && proximoPagamento < hoje && !isAluno;
        
        if (isInadimplente || (clienteData.status === 'Inadimplente' && !isAluno)) {
          // Salvar dados para mostrar tela de bloqueio
          setBlockedData({
            dataVencimento: clienteData.proximo_pagamento || new Date().toISOString(),
            plano: clienteData.plano || 'Básico'
          });
          setStep("blocked");
          setIsLoading(false);
          return;
        }
      }

      // Salvar domínio no localStorage para uso posterior
      localStorage.setItem("user_dominio", dominio.trim().toLowerCase());
      localStorage.setItem("user_nome", userData.nome);
      
      // Salvar unidades_acesso no localStorage
      if (userData.unidades_acesso && userData.unidades_acesso.length > 0) {
        localStorage.setItem("user_unidades_acesso", JSON.stringify(userData.unidades_acesso));
      } else {
        localStorage.removeItem("user_unidades_acesso");
      }

      // Buscar unidades disponíveis (filtradas pelo acesso do usuário)
      let unidadesQuery = supabase
        .from("tb_unidades")
        .select("id, nome, endereco_cidade, endereco_estado")
        .eq("dominio", dominio.trim().toLowerCase())
        .eq("ativo", true)
        .order("nome");
      
      // Se o usuário tem restrição de acesso, filtrar
      if (userData.unidades_acesso && userData.unidades_acesso.length > 0) {
        unidadesQuery = unidadesQuery.in("id", userData.unidades_acesso);
      }

      const { data: unidadesData } = await unidadesQuery;

      const unidadesList = (unidadesData || []) as Unidade[];

      if (unidadesList.length === 0) {
        // Criar Matriz automaticamente se não existir nenhuma unidade
        const { data: novaUnidade, error: unidadeError } = await supabase
          .from("tb_unidades")
          .insert({
            dominio: dominio.trim().toLowerCase(),
            nome: "Matriz",
            ativo: true,
          })
          .select("id, nome, endereco_cidade, endereco_estado")
          .single();

        if (!unidadeError && novaUnidade) {
          await finalizarLogin(novaUnidade.id);
        } else {
          // Erro ao criar unidade, prosseguir sem unidade
          await finalizarLogin(null);
        }
      } else if (unidadesList.length === 1) {
        // Apenas uma unidade, selecionar automaticamente
        await finalizarLogin(unidadesList[0].id);
      } else {
        // Múltiplas unidades, mostrar seleção
        setUnidades(unidadesList);
        setStep("selectUnidade");
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const finalizarLogin = async (unidadeId: number | null) => {
    try {
      if (unidadeId) {
        localStorage.setItem("unidade_ativa_id", unidadeId.toString());
      }

      // Atualizar last_login_at na conta do cliente
      await supabase
        .from("tb_clientes_saas")
        .update({ last_login_at: new Date().toISOString() })
        .eq("dominio", dominio.trim().toLowerCase());

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selecionarUnidade = async (unidade: Unidade) => {
    setIsLoading(true);
    await finalizarLogin(unidade.id);
  };

  const voltarParaDominio = () => {
    setStep("domain");
    setEmail("");
    setSenha("");
  };

  const voltarParaCredenciais = () => {
    setStep("credentials");
  };

  // Mostrar tela de bloqueio para inadimplentes
  if (step === "blocked" && blockedData) {
    return (
      <InadimplenteBlock 
        nomeCliente={nomeCliente}
        dataVencimento={blockedData.dataVencimento}
        plano={blockedData.plano}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="TrustHBPO Logo" className="h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl text-center">
            {step === "domain" && "Entrar"}
            {step === "credentials" && `Bem-vindo, ${nomeCliente}`}
            {step === "selectUnidade" && "Selecione a Empresa"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "domain" && "Digite o domínio"}
            {step === "credentials" && "Digite a senha"}
            {step === "selectUnidade" && "Escolha qual empresa deseja acessar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "domain" && (
            <form onSubmit={validarDominio} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dominio">Domínio</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dominio"
                    type="text"
                    placeholder="Digite o domínio"
                    value={dominio}
                    onChange={(e) => setDominio(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Próximo"
                )}
              </Button>
            </form>
          )}

          {step === "credentials" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={voltarParaDominio}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === "selectUnidade" && (
            <div className="space-y-4">
              <div className="space-y-2">
                {unidades.map((unidade) => (
                  <button
                    key={unidade.id}
                    onClick={() => selecionarUnidade(unidade)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{unidade.nome}</p>
                      {(unidade.endereco_cidade || unidade.endereco_estado) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[unidade.endereco_cidade, unidade.endereco_estado].filter(Boolean).join(" - ")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={voltarParaCredenciais}
                disabled={isLoading}
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
