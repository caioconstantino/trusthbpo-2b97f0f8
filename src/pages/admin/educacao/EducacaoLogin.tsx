import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";

const EducacaoLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .in("role", ["admin", "admin_educacao"]);
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error("Acesso negado. Você não tem permissão para o painel de Educação.");
      }
      toast({ title: "Bem-vindo!", description: "Painel de Educação carregado." });
      navigate("/admin/educacao");
    } catch (error: any) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900/60 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E0C158] flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-slate-900" />
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Painel Educação</CardTitle>
            <CardDescription className="text-slate-400">Acesso restrito à equipe de educação</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700 text-white" required />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700 text-white" required />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EducacaoLogin;
