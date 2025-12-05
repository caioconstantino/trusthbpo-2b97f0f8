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
  Wallet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const AdminFinanceiro = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-financeiro-stats"],
    queryFn: async () => {
      const { data: clientes, error } = await supabase
        .from("tb_clientes_saas")
        .select("plano, status, created_at, ultimo_pagamento");
      if (error) throw error;

      const ativos = clientes?.filter(c => c.status === "Ativo") || [];
      
      // Mapear planos para valores (Básico = 39.90, Pro = 99.90)
      const receitaBasico = ativos.filter(c => c.plano === "Básico" || c.plano === "R$ 39,90").length * 39.90;
      const receitaPro = ativos.filter(c => c.plano === "Pro" || c.plano === "R$ 99,90").length * 99.90;
      const receitaTotal = receitaBasico + receitaPro;

      // Total de receitas pagas (clientes que já pagaram pelo menos uma vez)
      const clientesPagantes = clientes?.filter(c => c.ultimo_pagamento) || [];
      let totalReceitasPagas = 0;
      clientesPagantes.forEach(c => {
        if (c.plano === "Básico" || c.plano === "R$ 39,90") totalReceitasPagas += 39.90;
        else if (c.plano === "Pro" || c.plano === "R$ 99,90") totalReceitasPagas += 99.90;
      });

      // Buscar comissões de indicações
      const { data: indicacoes } = await supabase
        .from("tb_indicacoes")
        .select("valor_comissao, status");
      
      const comissaoAPagar = indicacoes?.filter(i => i.status === "convertido" || i.status === "pendente")
        .reduce((acc, i) => acc + Number(i.valor_comissao), 0) || 0;

      // Receita SaaS por mês (últimos 6 meses)
      const hoje = new Date();
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const receitaPorMes: { mes: string; receita: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
        const mesNome = meses[data.getMonth()];
        
        // Clientes ativos até o fim do mês
        const ativosNoMes = clientes?.filter(c => {
          const created = new Date(c.created_at);
          return created <= fimMes && c.status === "Ativo";
        }) || [];
        
        const receitaMes = 
          ativosNoMes.filter(c => c.plano === "Básico" || c.plano === "R$ 39,90").length * 39.90 +
          ativosNoMes.filter(c => c.plano === "Pro" || c.plano === "R$ 99,90").length * 99.90;
        
        receitaPorMes.push({ mes: mesNome, receita: receitaMes });
      }

      return {
        clientesAtivos: ativos.length,
        receitaMensal: receitaTotal,
        ticketMedio: ativos.length > 0 ? receitaTotal / ativos.length : 0,
        planoBasico: ativos.filter(c => c.plano === "Básico" || c.plano === "R$ 39,90").length,
        planoPro: ativos.filter(c => c.plano === "Pro" || c.plano === "R$ 99,90").length,
        receitaPorMes,
        totalReceitasPagas,
        comissaoAPagar,
        receitaAnual: receitaTotal * 12,
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

  const COLORS = ["#3b82f6", "#8b5cf6"];

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
                Receita Mensal (MRR)
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
                Total Receitas Pagas
              </CardTitle>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {isLoading ? "..." : formatCurrency(stats?.totalReceitasPagas || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Receita recebida dos clientes</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Comissão a Pagar
              </CardTitle>
              <Wallet className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {isLoading ? "..." : formatCurrency(stats?.comissaoAPagar || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Indicações pendentes</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Receita Anual (ARR)
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                {isLoading ? "..." : formatCurrency(stats?.receitaAnual || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Projeção anual</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Evolução da Receita SaaS (R$)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats?.receitaPorMes || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Receita" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Insights Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Receitas Pagas</p>
                    <p className="text-white font-semibold">{formatCurrency(stats?.totalReceitasPagas || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Comissões Pendentes</p>
                    <p className="text-white font-semibold">{formatCurrency(stats?.comissaoAPagar || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Ticket Médio</p>
                    <p className="text-white font-semibold">{formatCurrency(stats?.ticketMedio || 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Básico (R$ 39,90)", value: stats?.planoBasico || 0 },
                      { name: "Pro (R$ 99,90)", value: stats?.planoPro || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-400 text-sm">Básico ({stats?.planoBasico || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-400 text-sm">Pro ({stats?.planoPro || 0})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Receita por Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Plano Básico (R$ 39,90)</span>
                    <span className="text-white font-semibold">
                      {isLoading ? "..." : formatCurrency((stats?.planoBasico || 0) * 39.90)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ 
                        width: `${stats?.receitaMensal ? ((stats.planoBasico * 39.90) / stats.receitaMensal) * 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Plano Pro (R$ 99,90)</span>
                    <span className="text-white font-semibold">
                      {isLoading ? "..." : formatCurrency((stats?.planoPro || 0) * 99.90)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ 
                        width: `${stats?.receitaMensal ? ((stats.planoPro * 99.90) / stats.receitaMensal) * 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Mensal</span>
                  <span className="text-2xl font-bold text-green-500">
                    {isLoading ? "..." : formatCurrency(stats?.receitaMensal || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminFinanceiro;
