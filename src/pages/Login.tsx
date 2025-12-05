import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import logo from "@/assets/logo.webp";

const Login = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"domain" | "credentials">("domain");
  const [dominio, setDominio] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Limpar sessão expirada ao carregar a página de login
  useEffect(() => {
    const clearExpiredSession = async () => {
      await supabase.auth.signOut();
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
            title: t('common.success'),
            description: `${t('dashboard.welcome')}, ${resultado.nome_cliente}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: t('common.error'),
            description: t('auth.invalidCredentials'),
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('auth.invalidCredentials'),
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('common.error'),
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
        throw new Error(t('auth.invalidCredentials'));
      }

      // Salvar domínio no localStorage para uso posterior
      localStorage.setItem("user_dominio", dominio.trim().toLowerCase());
      localStorage.setItem("user_nome", userData.nome);

      toast({
        title: t('auth.loginSuccess'),
        description: `${t('dashboard.welcome')}!`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('common.error'),
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
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="TrustHBPO Logo" className="h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl text-center">
            {step === "domain" ? t('auth.login') : `${t('dashboard.welcome')}, ${nomeCliente}`}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "domain"
              ? t('auth.enterDomain')
              : t('auth.enterPassword')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "domain" ? (
            <form onSubmit={validarDominio} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dominio">{t('auth.domain')}</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dominio"
                    type="text"
                    placeholder={t('auth.enterDomain')}
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
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.next')
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">{t('auth.password')}</Label>
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
                  {t('common.back')}
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('auth.login')
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
