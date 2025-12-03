import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, Lock } from "lucide-react";
import logo from "@/assets/logo.webp";

const Login = () => {
  const [step, setStep] = useState<"domain" | "credentials">("domain");
  const [dominio, setDominio] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
            title: "Domínio válido",
            description: `Bem-vindo, ${resultado.nome_cliente}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Domínio não encontrado",
            description: "O domínio informado não está cadastrado ou está inativo.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Domínio não encontrado",
          description: "O domínio informado não está cadastrado ou está inativo.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao validar domínio",
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
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .eq("dominio", dominio)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        throw new Error("Usuário não pertence a este domínio");
      }

      // Salvar domínio no localStorage para uso posterior
      localStorage.setItem("user_dominio", dominio.trim().toLowerCase());
      localStorage.setItem("user_nome", userData.nome);

      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const voltarParaDominio = () => {
    setStep("domain");
    setEmail("");
    setSenha("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="TrustHBPO Logo" className="h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl text-center">
            {step === "domain" ? "Acesse sua conta" : `Bem-vindo, ${nomeCliente}`}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "domain"
              ? "Digite o domínio da sua empresa para continuar"
              : "Digite suas credenciais para acessar o sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "domain" ? (
            <form onSubmit={validarDominio} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dominio">Domínio</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dominio"
                    type="text"
                    placeholder="suaempresa"
                    value={dominio}
                    onChange={(e) => setDominio(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite apenas o nome do domínio (sem espaços ou caracteres especiais)
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
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
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
