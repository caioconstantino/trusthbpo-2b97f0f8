import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format, addMonths, addWeeks, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Trash2, Loader2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContasReceber, ContaReceber } from "@/hooks/useContasReceber";
import { ClienteSearchInput } from "@/components/ClienteSearchInput";
import { ManageContasReceberCategoryDialog } from "@/components/ManageContasReceberCategoryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Parcela {
  numero: number;
  vencimento: Date;
  valor: number;
  formaPagamento: string;
}

// Get initial dates for current month
const getInitialStartDate = () => {
  const date = new Date();
  date.setDate(1);
  return date;
};

const getInitialEndDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return date;
};

const ContasReceber = () => {
  // Filter state (defined first so we can pass to hook)
  const [startDate, setStartDate] = useState<Date>(getInitialStartDate);
  const [endDate, setEndDate] = useState<Date>(getInitialEndDate);
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Initial filters for hook
  const initialFilters = useMemo(() => ({
    startDate: format(getInitialStartDate(), "yyyy-MM-dd"),
    endDate: format(getInitialEndDate(), "yyyy-MM-dd"),
    status: "Todos"
  }), []);

  const { 
    groupedContas, 
    loading, 
    totalPendente, 
    totalRecebido,
    fetchContas, 
    createConta,
    createContasBatch,
    receberConta,
    deleteConta 
  } = useContasReceber(initialFilters);

  // Form state
  const [tipoCadastro, setTipoCadastro] = useState<"unico" | "parcelado" | "recorrente">("unico");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState<Date>();
  const [formaPagamento, setFormaPagamento] = useState("");
  const [cliente, setCliente] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState({ current: 0, total: 0 });

  // Parcelamento state
  const [numParcelas, setNumParcelas] = useState(2);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  // Recorrência state
  const [frequencia, setFrequencia] = useState<"mensal" | "semanal" | "quinzenal">("mensal");
  const [numOcorrencias, setNumOcorrencias] = useState(12);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Generate parcelas when parcelamento changes
  const generateParcelas = (num: number, valorTotal: number, dataInicial: Date) => {
    const valorParcela = valorTotal / num;
    const novasParcelas: Parcela[] = [];

    for (let i = 0; i < num; i++) {
      const dataVencimento = addMonths(dataInicial, i);
      novasParcelas.push({
        numero: i + 1,
        vencimento: dataVencimento,
        valor: i === num - 1 ? valorTotal - valorParcela * (num - 1) : valorParcela,
        formaPagamento: formaPagamento || "pix"
      });
    }

    setParcelas(novasParcelas);
  };

  const handleNumParcelasChange = (num: string) => {
    const n = parseInt(num);
    setNumParcelas(n);
    if (valor && vencimento) {
      generateParcelas(n, parseFloat(valor), vencimento);
    }
  };

  const updateParcela = (index: number, field: keyof Parcela, value: any) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index] = { ...novasParcelas[index], [field]: value };
    setParcelas(novasParcelas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descricao) {
      return;
    }

    setSaving(true);
    setSavingProgress({ current: 0, total: 0 });

    try {
      if (tipoCadastro === "unico") {
        if (!valor || !vencimento) {
          setSaving(false);
          return;
        }
        setSavingProgress({ current: 0, total: 1 });
        await createConta({
          categoria: categoria ? categoria.toUpperCase() : undefined,
          descricao,
          valor: parseFloat(valor),
          vencimento: format(vencimento, "yyyy-MM-dd"),
          forma_pagamento: formaPagamento || undefined,
          cliente: cliente || undefined
        });
        setSavingProgress({ current: 1, total: 1 });
      } else if (tipoCadastro === "parcelado") {
        if (parcelas.length === 0) {
          setSaving(false);
          return;
        }
        const contasData = parcelas.map(parcela => ({
          categoria: categoria ? categoria.toUpperCase() : undefined,
          descricao: `${descricao} (${parcela.numero}/${parcelas.length})`,
          valor: parcela.valor,
          vencimento: format(parcela.vencimento, "yyyy-MM-dd"),
          forma_pagamento: parcela.formaPagamento || undefined,
          cliente: cliente || undefined
        }));
        
        setSavingProgress({ current: 0, total: contasData.length });
        await createContasBatch(contasData, (current, total) => {
          setSavingProgress({ current, total });
        });
      } else if (tipoCadastro === "recorrente") {
        if (!valor || !vencimento) {
          setSaving(false);
          return;
        }
        const valorNum = parseFloat(valor);
        const contasData = [];
        
        for (let i = 0; i < numOcorrencias; i++) {
          let dataVencimento: Date;
          
          if (frequencia === "mensal") {
            dataVencimento = addMonths(vencimento, i);
          } else if (frequencia === "quinzenal") {
            dataVencimento = addDays(vencimento, i * 15);
          } else {
            dataVencimento = addWeeks(vencimento, i);
          }

          contasData.push({
            categoria: categoria ? categoria.toUpperCase() : undefined,
            descricao: `${descricao} (${i + 1}/${numOcorrencias})`,
            valor: valorNum,
            vencimento: format(dataVencimento, "yyyy-MM-dd"),
            forma_pagamento: formaPagamento || undefined,
            cliente: cliente || undefined
          });
        }

        setSavingProgress({ current: 0, total: contasData.length });
        await createContasBatch(contasData, (current, total) => {
          setSavingProgress({ current, total });
        });
      }

      // Reset form
      setCategoria("");
      setDescricao("");
      setValor("");
      setVencimento(undefined);
      setFormaPagamento("");
      setCliente("");
      setParcelas([]);
      setNumParcelas(2);
      setNumOcorrencias(12);
      
      // Refresh with current filters
      await fetchContas({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        status: statusFilter
      });
    } catch (error) {
      console.error("Error creating receita:", error);
    }

    setSaving(false);
    setSavingProgress({ current: 0, total: 0 });
  };

  const handleFilter = () => {
    fetchContas({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      status: statusFilter
    });
  };

  const handleReceber = async () => {
    if (receivingId) {
      await receberConta(receivingId);
      setReceivingId(null);
      await fetchContas({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        status: statusFilter
      });
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteConta(deletingId);
      setDeletingId(null);
      await fetchContas({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        status: statusFilter
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Pendente</p>
            <p className="text-2xl font-bold text-amber-600">
              R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Recebido</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Nova Receita</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Tipo de cadastro */}
            <Tabs value={tipoCadastro} onValueChange={(v) => setTipoCadastro(v as any)} className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="unico">Único</TabsTrigger>
                <TabsTrigger value="parcelado">Parcelado</TabsTrigger>
                <TabsTrigger value="recorrente">Recorrente</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div>
                <Label className="text-xs">Categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: VENDAS"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label className="text-xs">Cliente</Label>
                <div className="mt-1">
                  <ClienteSearchInput
                    value={cliente}
                    onChange={setCliente}
                    placeholder="Buscar cliente..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">
                  {tipoCadastro === "parcelado" ? "Valor Total" : "Valor"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => {
                    setValor(e.target.value);
                    if (tipoCadastro === "parcelado" && vencimento && e.target.value) {
                      generateParcelas(numParcelas, parseFloat(e.target.value), vencimento);
                    }
                  }}
                  placeholder="0,00"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label className="text-xs">
                  {tipoCadastro === "parcelado" ? "1º Vencimento" : "Vencimento"}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 h-9 justify-start text-left font-normal",
                        !vencimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vencimento ? format(vencimento, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={vencimento}
                      onSelect={(date) => {
                        setVencimento(date);
                        if (tipoCadastro === "parcelado" && date && valor) {
                          generateParcelas(numParcelas, parseFloat(valor), date);
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Opções específicas por tipo */}
            {tipoCadastro === "unico" && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Forma Recebimento</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {tipoCadastro === "parcelado" && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Nº de Parcelas</Label>
                    <Select value={numParcelas.toString()} onValueChange={handleNumParcelasChange}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Forma Recebimento Padrão</Label>
                    <Select value={formaPagamento} onValueChange={(v) => {
                      setFormaPagamento(v);
                      setParcelas(parcelas.map(p => ({ ...p, formaPagamento: v })));
                    }}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {parcelas.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-xs font-medium grid grid-cols-4 gap-2">
                      <span>Parcela</span>
                      <span>Vencimento</span>
                      <span>Valor</span>
                      <span>Forma Receb.</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {parcelas.map((parcela, index) => (
                        <div key={index} className="px-3 py-2 border-t border-border grid grid-cols-4 gap-2 items-center">
                          <span className="text-sm">{parcela.numero}/{parcelas.length}</span>
                          <Input
                            type="date"
                            value={format(parcela.vencimento, "yyyy-MM-dd")}
                            onChange={(e) => updateParcela(index, "vencimento", new Date(e.target.value + 'T00:00:00'))}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={parcela.valor.toFixed(2)}
                            onChange={(e) => updateParcela(index, "valor", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                          />
                          <Select
                            value={parcela.formaPagamento}
                            onValueChange={(v) => updateParcela(index, "formaPagamento", v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="transferencia">Transf.</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="cartao">Cartão</SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tipoCadastro === "recorrente" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Frequência</Label>
                  <Select value={frequencia} onValueChange={(v) => setFrequencia(v as any)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Nº de Ocorrências</Label>
                  <Select value={numOcorrencias.toString()} onValueChange={(v) => setNumOcorrencias(parseInt(v))}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 6, 12, 18, 24, 36, 48].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} vezes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Forma Recebimento</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {saving && savingProgress.total > 1 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Cadastrando...</span>
                    <span>{savingProgress.current}/{savingProgress.total}</span>
                  </div>
                  <Progress value={(savingProgress.current / savingProgress.total) * 100} className="h-2" />
                </div>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {savingProgress.total > 1 
                        ? `Salvando ${savingProgress.current}/${savingProgress.total}...`
                        : "Salvando..."
                      }
                    </>
                  ) : "Cadastrar"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1 h-9 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1 h-9 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleFilter} className="w-full h-9">
              Filtrar
            </Button>
          </div>
        </div>

        {/* Incomes List */}
        {Object.keys(groupedContas).length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            Nenhuma receita encontrada
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {Object.entries(groupedContas).map(([categoryName, categoryContas], index) => {
              const total = categoryContas.reduce((sum, c) => sum + Number(c.valor), 0);
              
              return (
                <AccordionItem key={categoryName} value={`category-${index}`} className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="bg-green-600 text-white px-4 py-2 hover:no-underline hover:bg-green-700">
                    <span className="font-semibold text-sm">
                      {categoryName} - R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </AccordionTrigger>
                  
                  <AccordionContent className="bg-card pb-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-xs">Descrição</th>
                            <th className="text-left py-2 px-3 font-medium text-xs">Cliente</th>
                            <th className="text-right py-2 px-3 font-medium text-xs">Valor</th>
                            <th className="text-left py-2 px-3 font-medium text-xs">Vencimento</th>
                            <th className="text-left py-2 px-3 font-medium text-xs">Status</th>
                            <th className="text-center py-2 px-3 font-medium text-xs w-28">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryContas.map((conta) => (
                            <tr key={conta.id} className="border-t">
                              <td className="py-2 px-3 text-sm">{conta.descricao}</td>
                              <td className="py-2 px-3 text-sm">{conta.cliente || "-"}</td>
                              <td className="py-2 px-3 text-sm text-right font-medium">
                                R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-sm">{formatDate(conta.vencimento)}</td>
                              <td className="py-2 px-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  conta.status === "recebido" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                )}>
                                  {conta.status === "recebido" ? "Recebido" : "Pendente"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-center gap-1">
                                  {conta.status === "pendente" && (
                                    <Button
                                      size="icon"
                                      className="h-7 w-7 bg-green-600 hover:bg-green-700"
                                      onClick={() => setReceivingId(conta.id)}
                                      title="Marcar como recebido"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7"
                                    onClick={() => setDeletingId(conta.id)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Confirm Receive Dialog */}
      <AlertDialog open={!!receivingId} onOpenChange={() => setReceivingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recebimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta receita será marcada como recebida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReceber} className="bg-green-600 hover:bg-green-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManageContasReceberCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSelectCategory={setCategoria}
      />
    </DashboardLayout>
  );
};

export default ContasReceber;
