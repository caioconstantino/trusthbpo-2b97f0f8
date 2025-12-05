import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut,
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  Calendar,
  Briefcase
} from "lucide-react";
import { format, addMonths, setDate, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Revenda {
  id: string;
  nome: string;
  email: string;
  slug: string | null;
  status: string;
  saldo: number;
  total_ganho: number;
  total_sacado: number;
  comissao_percentual: number;
}

interface Venda {
  id: string;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_dominio: string | null;
  produto_nome: string;
  valor_venda: number;
  lucro: number;
  status: string;
  created_at: string;
}

interface Cliente {
  id: number;
  razao_social: string;
  email: string | null;
  telefone: string | null;
  dominio: string;
  status: string;
  plano: string | null;
  created_at: string | null;
}

const RevendaDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revenda, setRevenda] = useState<Revenda | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/revenda/login");
        return;
      }

      // Buscar dados da revenda
      const { data: revendaData, error } = await supabase
        .from("tb_revendas")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error || !revendaData) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setRevenda(revendaData);
      setLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const { data: vendas = [] } = useQuery({
    queryKey: ["revenda-vendas", revenda?.id],
    queryFn: async () => {
      if (!revenda) return [];
      const { data, error } = await supabase
        .from("tb_revendas_vendas")
        .select("*")
        .eq("revenda_id", revenda.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Venda[];
    },
    enabled: !!revenda,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["revenda-produtos", revenda?.id],
    queryFn: async () => {
      if (!revenda) return [];
      const { data, error } = await supabase
        .from("tb_revendas_produtos")
        .select("*")
        .eq("revenda_id", revenda.id);
      if (error) throw error;
      return data;
    },
    enabled: !!revenda,
  });

  // Buscar clientes da carteira da revenda (pelo cupom/slug)
  const { data: clientes = [] } = useQuery({
    queryKey: ["revenda-clientes", revenda?.slug],
    queryFn: async () => {
      if (!revenda?.slug) return [];
      const { data, error } = await supabase
        .from("tb_clientes_saas")
        .select("*")
        .eq("cupom", revenda.slug)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Cliente[];
    },
    enabled: !!revenda?.slug,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/revenda/login");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!revenda) {
    return null;
  }

  // Calcular métricas
  const vendasPagas = vendas.filter(v => v.status === "pago");
  const totalVendas = vendasPagas.reduce((acc, v) => acc + v.valor_venda, 0);
  const totalLucro = vendasPagas.reduce((acc, v) => acc + v.lucro, 0);
  const totalClientes = new Set(vendasPagas.map(v => v.cliente_email)).size;

  // Dados para gráfico de evolução
  const vendasPorMes = vendas.reduce((acc: Record<string, { vendas: number; lucro: number }>, venda) => {
    const mes = format(new Date(venda.created_at), "MMM/yy", { locale: ptBR });
    if (!acc[mes]) {
      acc[mes] = { vendas: 0, lucro: 0 };
    }
    if (venda.status === "pago") {
      acc[mes].vendas += venda.valor_venda;
      acc[mes].lucro += venda.lucro;
    }
    return acc;
  }, {});

  const chartData = Object.entries(vendasPorMes).map(([mes, data]) => ({
    mes,
    vendas: data.vendas,
    lucro: data.lucro,
  })).slice(-6);

  // Dados para gráfico de pizza
  const vendasPorProduto = vendas.reduce((acc: Record<string, number>, venda) => {
    if (venda.status === "pago") {
      acc[venda.produto_nome] = (acc[venda.produto_nome] || 0) + venda.valor_venda;
    }
    return acc;
  }, {});

  const pieData = Object.entries(vendasPorProduto).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const landingUrl = revenda.slug ? `${window.location.origin}/revenda/${revenda.slug}` : null;

  // Calcular próximas datas de pagamento
  // Fecha fatura dia 30, Pagamos dia 5
  const hoje = new Date();
  let proximoFechamento = setDate(hoje, 30);
  if (isBefore(proximoFechamento, hoje)) {
    proximoFechamento = setDate(addMonths(hoje, 1), 30);
  }
  
  let proximoPagamento = setDate(addMonths(proximoFechamento, 1), 5);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo': return 'bg-green-500/20 text-green-400';
      case 'inativo': return 'bg-slate-500/20 text-slate-400';
      case 'lead': return 'bg-blue-500/20 text-blue-400';
      case 'suspenso': return 'bg-red-500/20 text-red-400';
      case 'cancelado': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
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
              <h1 className="text-xl font-bold text-white">Painel da Revenda</h1>
              <p className="text-xs text-slate-400">{revenda.nome}</p>
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Landing Page Link */}
        {landingUrl && (
          <Card className="bg-primary/10 border-primary/30 mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Sua landing page de vendas:</p>
                <p className="text-primary font-medium">{landingUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/20"
                  onClick={() => copyToClipboard(landingUrl)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => window.open(landingUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saldo Disponível */}
        <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(revenda.saldo || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Fechamento da Fatura</p>
                  <p className="text-xl font-semibold text-white">
                    Dia 30 - {format(proximoFechamento, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Próximo Pagamento</p>
                  <p className="text-xl font-semibold text-white">
                    Dia 5 - {format(proximoPagamento, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-500/20 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                <span className="text-green-400 font-medium">Total Ganho:</span> {formatCurrency(revenda.total_ganho || 0)} | 
                <span className="text-amber-400 font-medium ml-2">Total Sacado:</span> {formatCurrency(revenda.total_sacado || 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total em Vendas</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalVendas)}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Lucro Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(totalLucro)}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Clientes</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalClientes}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Vendas Realizadas</CardTitle>
              <Package className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{vendasPagas.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Evolução de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="mes" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      stroke="#3b82f6"
                      name="Vendas"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#10b981"
                      name="Lucro"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Nenhuma venda registrada
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Vendas por Produto</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Nenhuma venda registrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Produtos */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Seus Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtos.map((produto: any) => (
                <Card key={produto.id} className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{produto.produto_nome}</h3>
                        <p className="text-sm text-slate-400">Preço original: {formatCurrency(produto.preco_original)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(produto.preco_revenda)}</p>
                        <p className="text-sm text-green-400">
                          Lucro: {formatCurrency(produto.preco_revenda - produto.preco_original)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Últimas Vendas */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">Data</TableHead>
                  <TableHead className="text-slate-400">Cliente</TableHead>
                  <TableHead className="text-slate-400">Produto</TableHead>
                  <TableHead className="text-slate-400">Valor</TableHead>
                  <TableHead className="text-slate-400">Lucro</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhuma venda registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.slice(0, 10).map((venda) => (
                    <TableRow key={venda.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-slate-300">
                        {format(new Date(venda.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-white">{venda.cliente_nome}</TableCell>
                      <TableCell className="text-slate-300">{venda.produto_nome}</TableCell>
                      <TableCell className="text-white">{formatCurrency(venda.valor_venda)}</TableCell>
                      <TableCell className="text-green-400">{formatCurrency(venda.lucro)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venda.status === "pago" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {venda.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Carteira de Clientes */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <CardTitle className="text-white">Carteira de Clientes</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {clientes.length} clientes
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Telefone</TableHead>
                  <TableHead className="text-slate-400">Domínio</TableHead>
                  <TableHead className="text-slate-400">Plano</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Data Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum cliente na carteira ainda. Compartilhe sua landing page para começar a receber clientes!
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{cliente.razao_social}</TableCell>
                      <TableCell className="text-slate-300">{cliente.email || '-'}</TableCell>
                      <TableCell className="text-slate-300">{cliente.telefone || '-'}</TableCell>
                      <TableCell className="text-primary">{cliente.dominio}</TableCell>
                      <TableCell className="text-slate-300">{cliente.plano || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cliente.status)}`}>
                          {cliente.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cliente.created_at ? format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RevendaDashboard;
