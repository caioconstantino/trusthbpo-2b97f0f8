import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Check, X, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/logo.webp";

interface CustomerData {
  razao_social: string;
  email: string;
  dominio: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: (score / 6) * 100, label: "Fraca", color: "bg-destructive" };
  if (score <= 4) return { score: (score / 6) * 100, label: "Média", color: "bg-yellow-500" };
  return { score: (score / 6) * 100, label: "Forte", color: "bg-green-500" };
}

export default function CriarUsuario() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dominio, setDominio] = useState("");
  const [dominioOriginal, setDominioOriginal] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dominioDisponivel, setDominioDisponivel] = useState<boolean | null>(null);
  const [verificandoDominio, setVerificandoDominio] = useState(false);

  const dominioParam = searchParams.get("dominio");

  const passwordStrength = useMemo(() => getPasswordStrength(senha), [senha]);

  // Fetch customer data by domain
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!dominioParam) {
        setCustomerError("Domínio não informado na URL. Por favor, utilize o link enviado por email.");
        setIsLoadingCustomer(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tb_clientes_saas")
          .select("razao_social, email, dominio")
          .eq("dominio", dominioParam)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setCustomerError("Domínio não encontrado. Verifique se o link está correto ou entre em contato com o suporte.");
          setIsLoadingCustomer(false);
          return;
        }

        setCustomerData(data);
        setNome(data.razao_social || "");
        setEmail(data.email || "");
        setDominio(data.dominio);
        setDominioOriginal(data.dominio);
        setDominioDisponivel(true);
      } catch (error) {
        console.error("Erro ao buscar dados do cliente:", error);
        setCustomerError("Erro ao carregar dados. Por favor, tente novamente.");
      } finally {
        setIsLoadingCustomer(false);
      }
    };

    fetchCustomerData();
  }, [dominioParam]);

  // Check domain availability when changed
  useEffect(() => {
    const verificarDominio = async () => {
      if (!dominio || dominio.length < 3) {
        setDominioDisponivel(null);
        return;
      }

      // If domain hasn't changed from original, it's available
      if (dominio === dominioOriginal) {
        setDominioDisponivel(true);
        return;
      }

      setVerificandoDominio(true);
      try {
        const { data, error } = await supabase
          .from("tb_clientes_saas")
          .select("dominio")
          .eq("dominio", dominio)
          .maybeSingle();

        if (error) throw error;
        setDominioDisponivel(!data);
      } catch (error) {
        console.error("Erro ao verificar domínio:", error);
        setDominioDisponivel(null);
      } finally {
        setVerificandoDominio(false);
      }
    };

    const debounce = setTimeout(verificarDominio, 500);
    return () => clearTimeout(debounce);
  }, [dominio, dominioOriginal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!dominioDisponivel) {
      toast({
        title: "Erro",
        description: "O domínio escolhido não está disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Update domain in tb_clientes_saas if changed (using edge function)
      if (dominioOriginal && dominioOriginal !== dominio) {
        const { data: updateData, error: updateError } = await supabase.functions.invoke(
          'update-customer-domain',
          {
            body: { originalDomain: dominioOriginal, newDomain: dominio }
          }
        );

        if (updateError) {
          console.error("Erro ao atualizar domínio:", updateError);
          throw new Error("Erro ao atualizar domínio. Tente novamente.");
        }

        if (updateData?.error) {
          throw new Error(updateData.error);
        }
      }

      // 2. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // 3. Create record in tb_usuarios
      const { error: usuarioError } = await supabase.from("tb_usuarios").insert({
        auth_user_id: authData.user.id,
        nome,
        email,
        dominio,
        status: "Ativo",
      });

      if (usuarioError) throw usuarioError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para o painel.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoadingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (customerError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Erro ao carregar</CardTitle>
            <CardDescription className="text-base mt-2">
              {customerError}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")} variant="outline">
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="TrustHBPO" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Criar sua conta</CardTitle>
          <CardDescription>
            Complete seu cadastro para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dominio">Domínio de acesso</Label>
              <div className="relative">
                <Input
                  id="dominio"
                  type="text"
                  placeholder="seu-dominio"
                  value={dominio}
                  onChange={(e) => setDominio(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  className={`pr-10 ${
                    dominioDisponivel === true
                      ? "border-green-500 focus-visible:ring-green-500"
                      : dominioDisponivel === false
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {verificandoDominio ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : dominioDisponivel === true ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : dominioDisponivel === false ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Este será o identificador único da sua empresa no sistema
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {senha && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className={`font-medium ${
                      passwordStrength.label === "Fraca" ? "text-destructive" :
                      passwordStrength.label === "Média" ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress 
                    value={passwordStrength.score} 
                    className="h-1.5"
                    indicatorClassName={passwordStrength.color}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmarSenha && senha !== confirmarSenha && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !dominioDisponivel}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
