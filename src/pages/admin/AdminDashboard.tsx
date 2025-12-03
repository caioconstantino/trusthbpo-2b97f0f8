import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  LogOut,
  UserCog,
  LayoutDashboard
} from "lucide-react";

interface Stats {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  clientesLeads: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    clientesLeads: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch SaaS customers from dedicated table
      const { data: clientes, error } = await supabase
        .from("tb_clientes_saas")
        .select("id, status");

      if (error) throw error;
      
      setStats({
        totalClientes: clientes?.length || 0,
        clientesAtivos: clientes?.filter(c => c.status === "Ativo").length || 0,
        clientesInativos: clientes?.filter(c => c.status === "Inativo").length || 0,
        clientesLeads: clientes?.filter(c => c.status === "Lead").length || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin SaaS</h1>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-6 py-2">
        <div className="max-w-7xl mx-auto flex gap-4">
          <Button 
            variant="ghost" 
            className="text-primary bg-primary/10 hover:bg-primary/20"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => navigate("/admin/clientes")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clientes SaaS
          </Button>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => navigate("/admin/usuarios")}
          >
            <UserCog className="w-4 h-4 mr-2" />
            Usuários
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Visão Geral</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total de Clientes
              </CardTitle>
              <Building2 className="w-5 h-5 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : stats.totalClientes}
              </div>
              <p className="text-xs text-slate-500 mt-1">Domínios cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Clientes Ativos
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {isLoading ? "..." : stats.clientesAtivos}
              </div>
              <p className="text-xs text-slate-500 mt-1">Com assinatura ativa</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Leads
              </CardTitle>
              <Users className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {isLoading ? "..." : stats.clientesLeads}
              </div>
              <p className="text-xs text-slate-500 mt-1">Em processo de conversão</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Inativos
              </CardTitle>
              <DollarSign className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {isLoading ? "..." : stats.clientesInativos}
              </div>
              <p className="text-xs text-slate-500 mt-1">Assinatura cancelada</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
            onClick={() => navigate("/admin/clientes")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Gerenciar Clientes</h4>
                <p className="text-sm text-slate-400">Ver todos os clientes SaaS</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
            onClick={() => navigate("/admin/usuarios")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Gerenciar Usuários</h4>
                <p className="text-sm text-slate-400">Usuários de cada domínio</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Financeiro</h4>
                <p className="text-sm text-slate-400">Pagamentos e receitas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
