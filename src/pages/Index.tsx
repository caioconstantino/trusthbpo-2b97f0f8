import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { OperationalSection } from "@/components/OperationalSection";
import { StockSection } from "@/components/StockSection";
import { DashboardTutorial } from "@/components/DashboardTutorial";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Accordion } from "@/components/ui/accordion";
import { Package, Archive, TrendingUp, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, startOfYear, subMonths, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermission } from "@/components/NoPermission";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface UnidadeData {
  vendas: number;
  produtos: number;
  total: number;
  custo: number;
}

interface UnidadeInfo {
  id: number;
  nome: string;
}

interface EstoqueData {
  totalPecas: number;
  valorEstoque: number;
  custoEstoque: number;
  lucroEsperado: number;
  produtosAtencao: number;
}

interface DashboardData {
  vendasHoje: number;
  custoHoje: number;
  contasReceberHoje: number;
  contasReceberVencidas: number;
  despesasHoje: number;
  vendasMes: number;
  vendasAno: number;
  totalClientes: number;
  totalProdutos: number;
  vendasPorMes: { mes: string; valor: number }[];
  vendasPorFormaPagamento: { forma: string; valor: number }[];
  vendasPorCategoria: { name: string; totalSold: number }[];
  topProdutos: { nome: string; quantidade: number; total: number }[];
  vendasPorUnidade: Record<string, UnidadeData>;
  estoquePorUnidade: Record<string, EstoqueData>;
  estoque: EstoqueData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type PeriodFilter = 'hoje' | 'ontem' | 'semana' | 'mes' | 'ano';

const Index = () => {
  const { canView, isLoading: permissionsLoading } = usePermissions();
  const { unidadeAtiva, isLoading: unidadeLoading } = useUnidadeAtiva();
  const [activeTab, setActiveTab] = useState("operacional");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('hoje');
  const [unidadesAcessiveis, setUnidadesAcessiveis] = useState<UnidadeInfo[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    vendasHoje: 0,
    custoHoje: 0,
    contasReceberHoje: 0,
    contasReceberVencidas: 0,
    despesasHoje: 0,
    vendasMes: 0,
    vendasAno: 0,
    totalClientes: 0,
    totalProdutos: 0,
    vendasPorMes: [],
    vendasPorFormaPagamento: [],
    vendasPorCategoria: [],
    topProdutos: [],
    vendasPorUnidade: {},
    estoquePorUnidade: {},
    estoque: {
      totalPecas: 0,
      valorEstoque: 0,
      custoEstoque: 0,
      lucroEsperado: 0,
      produtosAtencao: 0
    }
  });

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenDashboardTutorial");
    if (!hasSeenTutorial) {
      setTutorialOpen(true);
      localStorage.setItem("hasSeenDashboardTutorial", "true");
    }
    
    if (unidadeAtiva) {
      fetchDashboardData();
    }
  }, [unidadeAtiva, periodFilter]);

  const getDateRange = (period: PeriodFilter) => {
    const hoje = new Date();
    let inicio: Date;
    let fim: Date = hoje;

    switch (period) {
      case 'hoje':
        inicio = hoje;
        break;
      case 'ontem':
        inicio = subDays(hoje, 1);
        fim = subDays(hoje, 1);
        break;
      case 'semana':
        inicio = startOfWeek(hoje, { weekStartsOn: 0 });
        fim = endOfWeek(hoje, { weekStartsOn: 0 });
        break;
      case 'mes':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case 'ano':
        inicio = startOfYear(hoje);
        break;
      default:
        inicio = hoje;
    }

    return {
      inicio: format(inicio, 'yyyy-MM-dd 00:00:00'),
      fim: format(fim, 'yyyy-MM-dd 23:59:59')
    };
  };

  const fetchDashboardData = async () => {
    const currentDominio = localStorage.getItem("user_dominio");
    const unidadeId = unidadeAtiva?.id;
    
    if (!currentDominio || !unidadeId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get user's accessible units
      const unidadesAcessoStr = localStorage.getItem("user_unidades_acesso");
      const unidadesAcesso = unidadesAcessoStr ? JSON.parse(unidadesAcessoStr) as number[] : null;
      
      // Fetch accessible units
      let unidadesQuery = supabase
        .from('tb_unidades')
        .select('id, nome')
        .eq('dominio', currentDominio)
        .eq('ativo', true)
        .order('nome');
      
      if (unidadesAcesso && unidadesAcesso.length > 0) {
        unidadesQuery = unidadesQuery.in('id', unidadesAcesso);
      }
      
      const { data: unidadesData } = await unidadesQuery;
      const unidades = (unidadesData || []) as UnidadeInfo[];
      setUnidadesAcessiveis(unidades);
      
      const hoje = new Date();
      const inicioHoje = format(hoje, 'yyyy-MM-dd 00:00:00');
      const fimHoje = format(hoje, 'yyyy-MM-dd 23:59:59');
      const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd');
      const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd');
      const inicioAno = format(startOfYear(hoje), 'yyyy-MM-dd');

      // Get period date range for accordion data
      const { inicio: periodInicio, fim: periodFim } = getDateRange(periodFilter);

      // Buscar vendas de hoje
      const { data: vendasHoje } = await supabase
        .from('tb_vendas')
        .select('total, subtotal')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .gte('created_at', inicioHoje)
        .lte('created_at', fimHoje);

      const totalVendasHoje = vendasHoje?.reduce((acc, v) => acc + Number(v.total), 0) || 0;
      const custoVendasHoje = vendasHoje?.reduce((acc, v) => acc + Number(v.subtotal) * 0.7, 0) || 0;

      // Buscar vendas do mês
      const { data: vendasMes } = await supabase
        .from('tb_vendas')
        .select('total')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .gte('created_at', inicioMes)
        .lte('created_at', fimMes);

      const totalVendasMes = vendasMes?.reduce((acc, v) => acc + Number(v.total), 0) || 0;

      // Buscar vendas do ano
      const { data: vendasAno } = await supabase
        .from('tb_vendas')
        .select('total')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .gte('created_at', inicioAno);

      const totalVendasAno = vendasAno?.reduce((acc, v) => acc + Number(v.total), 0) || 0;

      // Buscar contas a receber de hoje
      const { data: contasReceberHoje } = await supabase
        .from('tb_contas_receber')
        .select('valor')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .eq('vencimento', format(hoje, 'yyyy-MM-dd'))
        .eq('status', 'pendente');

      const totalReceberHoje = contasReceberHoje?.reduce((acc, c) => acc + Number(c.valor), 0) || 0;

      // Buscar contas a receber vencidas
      const { data: contasReceberVencidas } = await supabase
        .from('tb_contas_receber')
        .select('valor')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .lt('vencimento', format(hoje, 'yyyy-MM-dd'))
        .eq('status', 'pendente');

      const totalReceberVencidas = contasReceberVencidas?.reduce((acc, c) => acc + Number(c.valor), 0) || 0;

      // Buscar despesas de hoje
      const { data: despesasHoje } = await supabase
        .from('tb_contas_pagar')
        .select('valor')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .eq('vencimento', format(hoje, 'yyyy-MM-dd'))
        .eq('status', 'pendente');

      const totalDespesasHoje = despesasHoje?.reduce((acc, c) => acc + Number(c.valor), 0) || 0;

      // Buscar total de clientes
      const { count: totalClientes } = await supabase
        .from('tb_clientes')
        .select('*', { count: 'exact', head: true })
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId);

      // Buscar total de produtos
      const { count: totalProdutos } = await supabase
        .from('tb_produtos')
        .select('*', { count: 'exact', head: true })
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .eq('ativo', true);

      // Buscar vendas por mês (últimos 12 meses)
      const vendasPorMes: { mes: string; valor: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const mesData = subMonths(hoje, i);
        const inicioMesLoop = format(startOfMonth(mesData), 'yyyy-MM-dd');
        const fimMesLoop = format(endOfMonth(mesData), 'yyyy-MM-dd');
        
        const { data: vendasDoMes } = await supabase
          .from('tb_vendas')
          .select('total')
          .eq('dominio', currentDominio)
          .eq('unidade_id', unidadeId)
          .gte('created_at', inicioMesLoop)
          .lte('created_at', fimMesLoop + ' 23:59:59');

        const totalMes = vendasDoMes?.reduce((acc, v) => acc + Number(v.total), 0) || 0;
        vendasPorMes.push({
          mes: format(mesData, 'MMM/yy', { locale: ptBR }),
          valor: totalMes
        });
      }

      // Buscar vendas por forma de pagamento - precisa filtrar por vendas da unidade
      const { data: vendasIds } = await supabase
        .from('tb_vendas')
        .select('id')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId);
      
      const vendaIdsArray = vendasIds?.map(v => v.id) || [];
      
      let pagamentos: any[] = [];
      if (vendaIdsArray.length > 0) {
        const { data: pagamentosData } = await supabase
          .from('tb_vendas_pagamentos')
          .select('forma_pagamento, valor')
          .in('venda_id', vendaIdsArray);
        pagamentos = pagamentosData || [];
      }

      const pagamentosPorForma: Record<string, number> = {};
      pagamentos?.forEach(p => {
        const forma = p.forma_pagamento || 'Outros';
        pagamentosPorForma[forma] = (pagamentosPorForma[forma] || 0) + Number(p.valor);
      });


      const vendasPorFormaPagamento = Object.entries(pagamentosPorForma).map(([forma, valor]) => ({
        forma,
        valor
      }));

      // Buscar top produtos - filtrando por vendas da unidade
      let itensVendidos: any[] = [];
      if (vendaIdsArray.length > 0) {
        const { data: itensData } = await supabase
          .from('tb_vendas_itens')
          .select('produto_nome, quantidade, total')
          .in('venda_id', vendaIdsArray);
        itensVendidos = itensData || [];
      }

      const produtosAgrupados: Record<string, { quantidade: number; total: number }> = {};
      itensVendidos?.forEach(item => {
        if (!produtosAgrupados[item.produto_nome]) {
          produtosAgrupados[item.produto_nome] = { quantidade: 0, total: 0 };
        }
        produtosAgrupados[item.produto_nome].quantidade += item.quantidade;
        produtosAgrupados[item.produto_nome].total += Number(item.total);
      });

      const topProdutos = Object.entries(produtosAgrupados)
        .map(([nome, dados]) => ({ nome, ...dados }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Buscar vendas por categoria - filtrando por vendas da unidade
      let vendasItensCategoria: any[] = [];
      if (vendaIdsArray.length > 0) {
        const { data: vendasItensData } = await supabase
          .from('tb_vendas_itens')
          .select('produto_id, total')
          .in('venda_id', vendaIdsArray);
        vendasItensCategoria = vendasItensData || [];
      }

      const { data: produtosCategoria } = await supabase
        .from('tb_produtos')
        .select('id, categoria_id')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId);

      const { data: categorias } = await supabase
        .from('tb_categorias')
        .select('id, nome')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId);

      const vendasPorCategoriaMap: Record<string, number> = {};
      vendasItensCategoria?.forEach(item => {
        const produto = produtosCategoria?.find(p => p.id === item.produto_id);
        const categoria = categorias?.find(c => c.id === produto?.categoria_id);
        const categoriaNome = categoria?.nome || 'Sem Categoria';
        vendasPorCategoriaMap[categoriaNome] = (vendasPorCategoriaMap[categoriaNome] || 0) + Number(item.total);
      });

      const vendasPorCategoria = Object.entries(vendasPorCategoriaMap).map(([name, totalSold]) => ({
        name,
        totalSold
      })).sort((a, b) => b.totalSold - a.totalSold);

      // Buscar dados de estoque - filtrando por unidade
      const { data: produtos } = await supabase
        .from('tb_produtos')
        .select('preco_venda, preco_custo, unidade_id')
        .eq('dominio', currentDominio)
        .eq('unidade_id', unidadeId)
        .eq('ativo', true);

      const custoEstoque = produtos?.reduce((acc, p) => acc + Number(p.preco_custo || 0), 0) || 0;
      const valorEstoque = produtos?.reduce((acc, p) => acc + Number(p.preco_venda || 0), 0) || 0;
      const lucroEsperado = valorEstoque - custoEstoque;

      // Calculate data per unit - buscar vendas de cada unidade no período selecionado
      const vendasPorUnidadeMap: Record<string, UnidadeData> = {};
      const estoquePorUnidadeMap: Record<string, EstoqueData> = {};
      
      for (const unidade of unidades) {
        // Buscar vendas da unidade no período selecionado
        const { data: vendasUnidadePeriodo } = await supabase
          .from('tb_vendas')
          .select('id, total, subtotal')
          .eq('dominio', currentDominio)
          .eq('unidade_id', unidade.id)
          .gte('created_at', periodInicio)
          .lte('created_at', periodFim);

        const vendasUnidade = vendasUnidadePeriodo || [];
        const totalUnidade = vendasUnidade.reduce((acc, v) => acc + Number(v.total), 0);
        
        // Buscar itens vendidos para calcular custo real
        let custoUnidade = 0;
        let produtosVendidosCount = 0;
        
        if (vendasUnidade.length > 0) {
          const vendaIds = vendasUnidade.map(v => v.id);
          const { data: itensVendidos } = await supabase
            .from('tb_vendas_itens')
            .select('produto_id, quantidade, preco_unitario')
            .in('venda_id', vendaIds);
          
          if (itensVendidos) {
            produtosVendidosCount = itensVendidos.reduce((acc, item) => acc + item.quantidade, 0);
            
            // Buscar preço de custo dos produtos
            const produtoIds = [...new Set(itensVendidos.map(i => i.produto_id))];
            const { data: produtosCusto } = await supabase
              .from('tb_produtos')
              .select('id, preco_custo')
              .in('id', produtoIds);
            
            if (produtosCusto) {
              const custoMap = new Map(produtosCusto.map(p => [p.id, Number(p.preco_custo || 0)]));
              custoUnidade = itensVendidos.reduce((acc, item) => {
                const custoProduto = custoMap.get(item.produto_id) || 0;
                return acc + (custoProduto * item.quantidade);
              }, 0);
            }
          }
        }
        
        vendasPorUnidadeMap[unidade.nome] = {
          vendas: vendasUnidade.length,
          produtos: produtosVendidosCount,
          total: totalUnidade,
          custo: custoUnidade
        };
        
        // Estoque por unidade - buscar produtos da unidade
        const { data: produtosUnidade } = await supabase
          .from('tb_produtos')
          .select('preco_venda, preco_custo')
          .eq('dominio', currentDominio)
          .eq('unidade_id', unidade.id)
          .eq('ativo', true);
        
        const produtosUnidadeData = produtosUnidade || [];
        const custoEstoqueUnidade = produtosUnidadeData.reduce((acc, p) => acc + Number(p.preco_custo || 0), 0);
        const valorEstoqueUnidade = produtosUnidadeData.reduce((acc, p) => acc + Number(p.preco_venda || 0), 0);
        
        estoquePorUnidadeMap[unidade.nome] = {
          totalPecas: produtosUnidadeData.length,
          valorEstoque: valorEstoqueUnidade,
          custoEstoque: custoEstoqueUnidade,
          lucroEsperado: valorEstoqueUnidade - custoEstoqueUnidade,
          produtosAtencao: 0
        };
      }

      setDashboardData({
        vendasHoje: totalVendasHoje,
        custoHoje: custoVendasHoje,
        contasReceberHoje: totalReceberHoje,
        contasReceberVencidas: totalReceberVencidas,
        despesasHoje: totalDespesasHoje,
        vendasMes: totalVendasMes,
        vendasAno: totalVendasAno,
        totalClientes: totalClientes || 0,
        totalProdutos: totalProdutos || 0,
        vendasPorMes,
        vendasPorFormaPagamento,
        vendasPorCategoria,
        topProdutos,
        vendasPorUnidade: vendasPorUnidadeMap,
        estoquePorUnidade: estoquePorUnidadeMap,
        estoque: {
          totalPecas: totalProdutos || 0,
          valorEstoque,
          custoEstoque,
          lucroEsperado,
          produtosAtencao: 0
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Show loading while checking permissions or loading unit
  if (permissionsLoading || unidadeLoading) {
    return (
      <DashboardLayout onTutorialClick={() => setTutorialOpen(true)}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Check permissions
  if (!canView("dashboard")) {
    return (
      <DashboardLayout>
        <NoPermission />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout onTutorialClick={() => setTutorialOpen(true)}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onTutorialClick={() => setTutorialOpen(true)}>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div id="metric-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Vendas (HOJE)"
            value={formatCurrency(dashboardData.vendasHoje)}
            subtitle={`Custo estimado: ${formatCurrency(dashboardData.custoHoje)}`}
            variant="sales"
          />
          <MetricCard
            title="Contas a receber (HOJE)"
            value={formatCurrency(dashboardData.contasReceberHoje)}
            subtitle={`Vencidas: ${formatCurrency(dashboardData.contasReceberVencidas)}`}
            variant="receivable"
          />
          <MetricCard
            title="Despesas (HOJE)"
            value={formatCurrency(dashboardData.despesasHoje)}
            variant="expenses"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vendas do Mês</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(dashboardData.vendasMes)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vendas do Ano</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(dashboardData.vendasAno)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Clientes</p>
                  <p className="text-lg font-bold">{dashboardData.totalClientes}</p>
                </div>
                <Package className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Produtos Ativos</p>
                  <p className="text-lg font-bold">{dashboardData.totalProdutos}</p>
                </div>
                <Archive className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Vendas por Mês */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendas por Mês (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.vendasPorMes}>
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorVendas)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Formas de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendas por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.vendasPorFormaPagamento}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="valor"
                      nameKey="forma"
                      label={({ forma, percent }) => `${forma}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {dashboardData.vendasPorFormaPagamento.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Total']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.topProdutos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="nome" 
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'total' ? formatCurrency(value) : value,
                      name === 'total' ? 'Total' : 'Quantidade'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Action Tabs with Period Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-2">
          <div className="flex gap-2 md:gap-4 overflow-x-auto">
            <button
              id="operacional-tab"
              onClick={() => setActiveTab("operacional")}
              className={`flex items-center gap-2 px-3 md:px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "operacional"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="text-sm md:text-base">Operacional</span>
            </button>
            <button
              id="estoque-tab"
              onClick={() => setActiveTab("estoque")}
              className={`flex items-center gap-2 px-3 md:px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "estoque"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="w-4 h-4" />
              <span className="text-sm md:text-base">Estoque</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={periodFilter} onValueChange={(value: PeriodFilter) => setPeriodFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="ontem">Ontem</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "operacional" && (
          <div id="branches-section">
            <Accordion type="multiple" className="space-y-3">
              {unidadesAcessiveis.map((unidade) => (
                <OperationalSection 
                  key={unidade.id}
                  branch={{
                    name: unidade.nome.toUpperCase(),
                    sales: dashboardData.vendasPorUnidade?.[unidade.nome]?.vendas || 0,
                    products: dashboardData.vendasPorUnidade?.[unidade.nome]?.produtos || 0,
                    total: dashboardData.vendasPorUnidade?.[unidade.nome]?.total || 0,
                    cost: dashboardData.vendasPorUnidade?.[unidade.nome]?.custo || 0,
                    categories: dashboardData.vendasPorCategoria || []
                  }}
                  value={`unidade-${unidade.id}`}
                />
              ))}
            </Accordion>
          </div>
        )}

        {activeTab === "estoque" && (
          <Accordion type="multiple" className="space-y-3">
            {unidadesAcessiveis.map((unidade) => (
              <StockSection 
                key={unidade.id}
                stock={{
                  name: unidade.nome.toUpperCase(),
                  pieces: dashboardData.estoquePorUnidade?.[unidade.nome]?.totalPecas || 0,
                  stockValue: dashboardData.estoquePorUnidade?.[unidade.nome]?.valorEstoque || 0,
                  stockCost: dashboardData.estoquePorUnidade?.[unidade.nome]?.custoEstoque || 0,
                  units: dashboardData.estoquePorUnidade?.[unidade.nome]?.totalPecas || 0,
                  expectedProfit: dashboardData.estoquePorUnidade?.[unidade.nome]?.lucroEsperado || 0,
                  hasAlert: (dashboardData.estoquePorUnidade?.[unidade.nome]?.produtosAtencao || 0) > 0
                }}
                value={`estoque-${unidade.id}`}
              />
            ))}
          </Accordion>
        )}

        {/* Product Carousel */}
        <ProductCarousel />
      </div>

      {/* Tutorial */}
      <DashboardTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </DashboardLayout>
  );
};

export default Index;
