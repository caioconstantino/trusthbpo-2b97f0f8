import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  LogOut,
  LayoutDashboard,
  Webhook,
  GraduationCap
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Stats {
  totalClientes: number;
  clientesAtivos: number;
  clientesInadimplentes: number;
  clientesCancelados: number;
  clientesLeads: number;
  receitaMensal: number;
  receitaSaasPorMes: { mes: string; total: number }[];
  clientesPorMes: { mes: string; total: number }[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInadimplentes: 0,
    clientesCancelados: 0,
    clientesLeads: 0,
    receitaMensal: 0,
    receitaSaasPorMes: [],
    clientesPorMes: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: clientes, error } = await supabase
        .from("tb_clientes_saas")
        .select("id, status, plano, created_at, proximo_pagamento");

      if (error) throw error;

      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];

      // Calcular receita mensal
      const ativos = clientes?.filter(c => c.status === "Ativo") || [];
      const receita3990 = ativos.filter(c => c.plano === "R$ 39,90").length * 39.90;
      const receita9990 = ativos.filter(c => c.plano === "R$ 99,90").length * 99.90;

      // Clientes inadimplentes (ativos com próximo_pagamento vencido)
      const inadimplentes = clientes?.filter(c => 
        c.status === "Ativo" && 
        c.proximo_pagamento && 
        c.proximo_pagamento < hojeStr
      ).length || 0;

      // Clientes cancelados (status Inativo, Cancelado ou Suspenso)
      const cancelados = clientes?.filter(c => 
        c.status === "Inativo" || c.status === "Cancelado" || c.status === "Suspenso"
      ).length || 0;

      // Clientes por mês (últimos 6 meses)
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const clientesPorMes: { mes: string; total: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesNome = meses[data.getMonth()];
        const clientesNoMes = clientes?.filter(c => {
          const created = new Date(c.created_at);
          return created.getMonth() === data.getMonth() && created.getFullYear() === data.getFullYear();
        }).length || 0;
        clientesPorMes.push({ mes: mesNome, total: clientesNoMes });
      }

      // Receita SaaS por mês (baseado em clientes ativos acumulados)
      const receitaSaasPorMes: { mes: string; total: number }[] = [];
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
          ativosNoMes.filter(c => c.plano === "R$ 39,90").length * 39.90 +
          ativosNoMes.filter(c => c.plano === "R$ 99,90").length * 99.90;
        
        receitaSaasPorMes.push({ mes: mesNome, total: receitaMes });
      }
      
      setStats({
        totalClientes: clientes?.length || 0,
        clientesAtivos: ativos.length,
        clientesInadimplentes: inadimplentes,
        clientesCancelados: cancelados,
        clientesLeads: clientes?.filter(c => c.status === "Lead").length || 0,
        receitaMensal: receita3990 + receita9990,
        receitaSaasPorMes,
        clientesPorMes,
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

  const isActive = (path: string) => location.pathname === path;

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
            onClick={() => navigate("/admin/financeiro")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
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
                Inadimplentes
              </CardTitle>
              <Users className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {isLoading ? "..." : stats.clientesInadimplentes}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pagamento em atraso</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Cancelados
              </CardTitle>
              <DollarSign className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {isLoading ? "..." : stats.clientesCancelados}
              </div>
              <p className="text-xs text-slate-500 mt-1">Assinatura cancelada</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Novos Clientes por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.clientesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Receita SaaS Mensal (R$)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.receitaSaasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                  />
                  <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Distribuição de Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Ativos", value: stats.clientesAtivos, color: "#22c55e" },
                      { name: "Leads", value: stats.clientesLeads, color: "#3b82f6" },
                      { name: "Inadimplentes", value: stats.clientesInadimplentes, color: "#f59e0b" },
                      { name: "Cancelados", value: stats.clientesCancelados, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: "Ativos", value: stats.clientesAtivos, color: "#22c55e" },
                      { name: "Leads", value: stats.clientesLeads, color: "#3b82f6" },
                      { name: "Inadimplentes", value: stats.clientesInadimplentes, color: "#f59e0b" },
                      { name: "Cancelados", value: stats.clientesCancelados, color: "#ef4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-400 text-sm">Ativos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-400 text-sm">Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-400 text-sm">Inadimplentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-slate-400 text-sm">Cancelados</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Receita Recorrente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.receitaMensal)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Receita Mensal Recorrente (MRR)</p>
                </div>
                <div className="text-center pt-4 border-t border-slate-700">
                  <p className="text-2xl font-bold text-amber-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.receitaMensal * 12)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Receita Anual Projetada (ARR)</p>
                </div>
              </div>
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
            onClick={() => navigate("/admin/escolas")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Escolas Parceiras</h4>
                <p className="text-sm text-slate-400">Instituições de ensino</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
            onClick={() => navigate("/admin/financeiro")}
          >
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
