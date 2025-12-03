import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import logo from "@/assets/logo.webp";

export default function CriarUsuario() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dominio, setDominio] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dominioDisponivel, setDominioDisponivel] = useState<boolean | null>(null);
  const [verificandoDominio, setVerificandoDominio] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const dominioParam = searchParams.get("dominio");

    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (dominioParam) setDominio(dominioParam);
  }, [searchParams]);

  useEffect(() => {
    const verificarDominio = async () => {
      if (!dominio || dominio.length < 3) {
        setDominioDisponivel(null);
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

        // Se encontrou um registro, verificar se é o domínio do email atual
        const emailParam = searchParams.get("email");
        if (data) {
          const { data: clienteData } = await supabase
            .from("tb_clientes_saas")
            .select("email")
            .eq("dominio", dominio)
            .maybeSingle();
          
          // Domínio disponível se pertence ao cliente atual
          setDominioDisponivel(clienteData?.email === decodeURIComponent(emailParam || ""));
        } else {
          setDominioDisponivel(true);
        }
      } catch (error) {
        console.error("Erro ao verificar domínio:", error);
        setDominioDisponivel(null);
      } finally {
        setVerificandoDominio(false);
      }
    };

    const debounce = setTimeout(verificarDominio, 500);
    return () => clearTimeout(debounce);
  }, [dominio, searchParams]);

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
      // 1. Criar usuário no Supabase Auth
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

      // 2. Criar registro na tabela tb_usuarios
      const { error: usuarioError } = await supabase.from("tb_usuarios").insert({
        auth_user_id: authData.user.id,
        nome,
        email,
        dominio,
        status: "Ativo",
      });

      if (usuarioError) throw usuarioError;

      // 3. Atualizar o domínio do cliente SaaS se foi alterado
      const dominioOriginal = searchParams.get("dominio");
      if (dominioOriginal && dominioOriginal !== dominio) {
        const { error: updateError } = await supabase
          .from("tb_clientes_saas")
          .update({ dominio })
          .eq("dominio", dominioOriginal);

        if (updateError) {
          console.error("Erro ao atualizar domínio:", updateError);
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para o painel.",
      });

      // Redirecionar para o dashboard
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
