import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermission } from "@/components/NoPermission";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, getDay, getHours, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface SalesByHour {
  day: number;
  hour: number;
  total: number;
  count: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h to 20h

const CentralContas = () => {
  const { canView, isLoading: permissionsLoading } = usePermissions();
  const dominio = localStorage.getItem("user_dominio") || "";
  const [period, setPeriod] = useState("6");
  const [loading, setLoading] = useState(true);
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [salesHeatmap, setSalesHeatmap] = useState<SalesByHour[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [revenueCategories, setRevenueCategories] = useState<CategoryData[]>([]);
  const [currentMonthReceitas, setCurrentMonthReceitas] = useState(0);
  const [currentMonthDespesas, setCurrentMonthDespesas] = useState(0);
  const [lastMonthReceitas, setLastMonthReceitas] = useState(0);
  const [lastMonthDespesas, setLastMonthDespesas] = useState(0);
  const [forecastReceitas, setForecastReceitas] = useState(0);

  const fetchMonthlyData = async () => {
    const months = parseInt(period);
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(new Date(), months - 1));
    const unidadeId = localStorage.getItem("unidade_ativa_id");

    let receitasQuery = supabase
      .from("tb_contas_receber")
      .select("valor, vencimento, status")
      .eq("dominio", dominio)
      .gte("vencimento", format(startDate, "yyyy-MM-dd"))
      .lte("vencimento", format(endDate, "yyyy-MM-dd"));
    
    if (unidadeId) {
      receitasQuery = receitasQuery.eq("unidade_id", parseInt(unidadeId));
    }

    const { data: receitasData } = await receitasQuery;

    let vendasQuery = supabase
      .from("tb_vendas")
      .select("total, created_at")
      .eq("dominio", dominio)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());
    
    if (unidadeId) {
      vendasQuery = vendasQuery.eq("unidade_id", parseInt(unidadeId));
    }

    const { data: vendasData } = await vendasQuery;

    let despesasQuery = supabase
      .from("tb_contas_pagar")
      .select("valor, vencimento, status")
      .eq("dominio", dominio)
      .gte("vencimento", format(startDate, "yyyy-MM-dd"))
      .lte("vencimento", format(endDate, "yyyy-MM-dd"));
    
    if (unidadeId) {
      despesasQuery = despesasQuery.eq("unidade_id", parseInt(unidadeId));
    }

    const { data: despesasData } = await despesasQuery;

    const monthlyMap = new Map<string, { receitas: number; despesas: number }>();
    
    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i);
      const key = format(date, "yyyy-MM");
      monthlyMap.set(key, { receitas: 0, despesas: 0 });
    }

    receitasData?.forEach(item => {
      const key = item.vencimento.substring(0, 7);
      if (monthlyMap.has(key)) {
        const current = monthlyMap.get(key)!;
        current.receitas += Number(item.valor);
      }
    });

    vendasData?.forEach(item => {
      const key = format(parseISO(item.created_at), "yyyy-MM");
      if (monthlyMap.has(key)) {
        const current = monthlyMap.get(key)!;
        current.receitas += Number(item.total);
      }
    });

    despesasData?.forEach(item => {
      const key = item.vencimento.substring(0, 7);
      if (monthlyMap.has(key)) {
        const current = monthlyMap.get(key)!;
        current.despesas += Number(item.valor);
      }
    });

    const result: MonthlyData[] = Array.from(monthlyMap.entries())
      .map(([key, value]) => ({
        month: format(parseISO(`${key}-01`), "MMM/yy", { locale: ptBR }),
        receitas: value.receitas,
        despesas: value.despesas,
        saldo: value.receitas - value.despesas
      }))
      .reverse();

    setMonthlyData(result);

    const currentKey = format(new Date(), "yyyy-MM");
    const lastKey = format(subMonths(new Date(), 1), "yyyy-MM");
    
    setCurrentMonthReceitas(monthlyMap.get(currentKey)?.receitas || 0);
    setCurrentMonthDespesas(monthlyMap.get(currentKey)?.despesas || 0);
    setLastMonthReceitas(monthlyMap.get(lastKey)?.receitas || 0);
    setLastMonthDespesas(monthlyMap.get(lastKey)?.despesas || 0);

    const receitasArray = Array.from(monthlyMap.values()).map(v => v.receitas).reverse();
    if (receitasArray.length >= 2) {
      const lastThree = receitasArray.slice(-3);
      const avgGrowth = lastThree.length > 1 
        ? (lastThree[lastThree.length - 1] - lastThree[0]) / lastThree.length
        : 0;
      setForecastReceitas(Math.max(0, receitasArray[receitasArray.length - 1] + avgGrowth));
    }
  };

  const fetchSalesHeatmap = async () => {
    const startDate = subMonths(new Date(), 3);
    const unidadeId = localStorage.getItem("unidade_ativa_id");
    
    let query = supabase
      .from("tb_vendas")
      .select("total, created_at")
      .eq("dominio", dominio)
      .gte("created_at", startDate.toISOString());
    
    if (unidadeId) {
      query = query.eq("unidade_id", parseInt(unidadeId));
    }

    const { data: vendasData } = await query;

    const heatmapData: SalesByHour[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (const hour of hours) {
        heatmapData.push({ day, hour, total: 0, count: 0 });
      }
    }

    vendasData?.forEach(venda => {
      const date = parseISO(venda.created_at);
      const day = getDay(date);
      const hour = getHours(date);
      
      if (hour >= 7 && hour <= 20) {
        const cell = heatmapData.find(c => c.day === day && c.hour === hour);
        if (cell) {
          cell.total += Number(venda.total);
          cell.count += 1;
        }
      }
    });

    setSalesHeatmap(heatmapData);
  };

  const fetchCategoryData = async () => {
    const startDate = startOfMonth(subMonths(new Date(), 2));
    const endDate = endOfMonth(new Date());
    const unidadeId = localStorage.getItem("unidade_ativa_id");

    let despesasQuery = supabase
      .from("tb_contas_pagar")
      .select("categoria, valor")
      .eq("dominio", dominio)
      .gte("vencimento", format(startDate, "yyyy-MM-dd"))
      .lte("vencimento", format(endDate, "yyyy-MM-dd"));
    
    if (unidadeId) {
      despesasQuery = despesasQuery.eq("unidade_id", parseInt(unidadeId));
    }

    const { data: despesasData } = await despesasQuery;

    const expenseMap = new Map<string, number>();
    despesasData?.forEach(item => {
      const cat = item.categoria || "Sem Categoria";
      expenseMap.set(cat, (expenseMap.get(cat) || 0) + Number(item.valor));
    });

    setExpenseCategories(
      Array.from(expenseMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    );

    let receitasQuery = supabase
      .from("tb_contas_receber")
      .select("categoria, valor")
      .eq("dominio", dominio)
      .gte("vencimento", format(startDate, "yyyy-MM-dd"))
      .lte("vencimento", format(endDate, "yyyy-MM-dd"));
    
    if (unidadeId) {
      receitasQuery = receitasQuery.eq("unidade_id", parseInt(unidadeId));
    }

    const { data: receitasData } = await receitasQuery;

    const revenueMap = new Map<string, number>();
    receitasData?.forEach(item => {
      const cat = item.categoria || "Vendas";
      revenueMap.set(cat, (revenueMap.get(cat) || 0) + Number(item.valor));
    });

    setRevenueCategories(
      Array.from(revenueMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    );
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMonthlyData(),
      fetchSalesHeatmap(),
      fetchCategoryData()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [period, dominio]);

  const maxHeatmapValue = useMemo(() => {
    return Math.max(...salesHeatmap.map(s => s.total), 1);
  }, [salesHeatmap]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const receitasChange = getPercentChange(currentMonthReceitas, lastMonthReceitas);
  const despesasChange = getPercentChange(currentMonthDespesas, lastMonthDespesas);
  const saldoAtual = currentMonthReceitas - currentMonthDespesas;

  const getHeatmapColor = (total: number, maxValue: number) => {
    if (total === 0) return "bg-muted/30";
    const intensity = Math.min(total / maxValue, 1);
    if (intensity < 0.25) return "bg-emerald-200 dark:bg-emerald-900/50";
    if (intensity < 0.5) return "bg-emerald-400 dark:bg-emerald-700/70";
    if (intensity < 0.75) return "bg-emerald-500 dark:bg-emerald-600";
    return "bg-emerald-600 dark:bg-emerald-500";
  };

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Check permissions after loading
  if (!canView("central_contas")) {
    return (
      <DashboardLayout>
        <NoPermission />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central de Contas</h1>
            <p className="text-muted-foreground">Insights financeiros do seu negócio</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas (Mês)</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(currentMonthReceitas)}
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  receitasChange >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {receitasChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(receitasChange).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas (Mês)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(currentMonthDespesas)}
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  despesasChange <= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {despesasChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(despesasChange).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo (Mês)</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    saldoAtual >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(saldoAtual)}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Previsão Próx. Mês</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(forecastReceitas)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Fluxo de Caixa
              </CardTitle>
              <CardDescription>Receitas vs Despesas ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="hsl(var(--chart-2))" 
                      fillOpacity={1} 
                      fill="url(#colorReceitas)"
                      name="Receitas"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="hsl(var(--chart-1))" 
                      fillOpacity={1} 
                      fill="url(#colorDespesas)"
                      name="Despesas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Balance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Saldo Mensal
              </CardTitle>
              <CardDescription>Evolução do saldo (Receitas - Despesas)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="saldo" 
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                      name="Saldo"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Calor de Vendas</CardTitle>
            <CardDescription>Volume de vendas por dia da semana e horário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[auto_repeat(14,1fr)] gap-1">
                  {/* Header row with hours */}
                  <div className="h-8" />
                  {hours.map(hour => (
                    <div key={hour} className="h-8 flex items-center justify-center text-xs text-muted-foreground">
                      {hour}h
                    </div>
                  ))}
                  
                  {/* Data rows */}
                  {dayNames.map((day, dayIndex) => (
                    <>
                      <div key={`label-${dayIndex}`} className="h-10 flex items-center justify-end pr-2 text-sm text-muted-foreground">
                        {day}
                      </div>
                      {hours.map(hour => {
                        const cell = salesHeatmap.find(c => c.day === dayIndex && c.hour === hour);
                        const total = cell?.total || 0;
                        return (
                          <div
                            key={`${dayIndex}-${hour}`}
                            className={cn(
                              "h-10 rounded-sm flex items-center justify-center text-xs font-medium transition-colors cursor-default",
                              getHeatmapColor(total, maxHeatmapValue),
                              total > 0 && "text-white dark:text-foreground"
                            )}
                            title={`${day} ${hour}h: ${formatCurrency(total)} (${cell?.count || 0} vendas)`}
                          >
                            {total > 0 && cell && cell.count > 0 && cell.count}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                  <span>Menos</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-sm bg-muted/30" />
                    <div className="w-4 h-4 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                    <div className="w-4 h-4 rounded-sm bg-emerald-400 dark:bg-emerald-700/70" />
                    <div className="w-4 h-4 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
                    <div className="w-4 h-4 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                  </div>
                  <span>Mais</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Despesas por Categoria
              </CardTitle>
              <CardDescription>Distribuição das despesas nos últimos 3 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {expenseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Sem dados de despesas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Receitas por Categoria
              </CardTitle>
              <CardDescription>Distribuição das receitas nos últimos 3 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {revenueCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {revenueCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Sem dados de receitas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CentralContas;
