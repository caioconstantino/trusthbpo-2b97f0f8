import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  LogOut,
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  Webhook,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet
} from "lucide-react";

const AdminFinanceiro = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-financeiro-stats"],
    queryFn: async () => {
      const { data: clientes, error } = await supabase
        .from("tb_clientes_saas")
        .select("plano, status");
      if (error) throw error;

      const ativos = clientes?.filter(c => c.status === "Ativo") || [];
      const receita3990 = ativos.filter(c => c.plano === "R$ 39,90").length * 39.90;
      const receita9990 = ativos.filter(c => c.plano === "R$ 99,90").length * 99.90;
      const receitaTotal = receita3990 + receita9990;

      return {
        clientesAtivos: ativos.length,
        receitaMensal: receitaTotal,
        ticketMedio: ativos.length > 0 ? receitaTotal / ativos.length : 0,
        plano3990: ativos.filter(c => c.plano === "R$ 39,90").length,
        plano9990: ativos.filter(c => c.plano === "R$ 99,90").length,
      };
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto">
          <Button 
            variant="ghost" 
            className={isActive("/admin") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/clientes") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/clientes")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clientes
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/escolas") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/escolas")}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Escolas
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/alunos") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/alunos")}
          >
            <Users className="w-4 h-4 mr-2" />
            Alunos
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/webhooks") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/webhooks")}
          >
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/financeiro") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Financeiro</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Receita Mensal
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {isLoading ? "..." : formatCurrency(stats?.receitaMensal || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Assinaturas ativas</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Clientes Ativos
              </CardTitle>
              <Users className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {isLoading ? "..." : stats?.clientesAtivos}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pagantes</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Ticket Médio
              </CardTitle>
              <Wallet className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                {isLoading ? "..." : formatCurrency(stats?.ticketMedio || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Por cliente</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Receita Anual Projetada
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {isLoading ? "..." : formatCurrency((stats?.receitaMensal || 0) * 12)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Baseado no mês atual</p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Plano R$ 39,90</span>
                </div>
                <span className="text-white font-semibold">{isLoading ? "..." : stats?.plano3990} clientes</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-300">Plano R$ 99,90</span>
                </div>
                <span className="text-white font-semibold">{isLoading ? "..." : stats?.plano9990} clientes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Receita por Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Plano R$ 39,90</span>
                </div>
                <span className="text-white font-semibold">
                  {isLoading ? "..." : formatCurrency((stats?.plano3990 || 0) * 39.90)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-300">Plano R$ 99,90</span>
                </div>
                <span className="text-white font-semibold">
                  {isLoading ? "..." : formatCurrency((stats?.plano9990 || 0) * 99.90)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminFinanceiro;
