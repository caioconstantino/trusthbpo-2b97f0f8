import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Pencil, Check, Trash2, Loader2, List } from "lucide-react";
import { ManageContasPagarCategoryDialog } from "@/components/ManageContasPagarCategoryDialog";
import { cn } from "@/lib/utils";
import { useContasPagar, ContaPagar } from "@/hooks/useContasPagar";
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

const ContasPagar = () => {
  const { 
    groupedContas, 
    loading, 
    totalPendente, 
    totalPago,
    fetchContas, 
    createConta, 
    pagarConta,
    deleteConta 
  } = useContasPagar();

  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState<Date>();
  const [formaPagamento, setFormaPagamento] = useState("");
  const [saving, setSaving] = useState(false);

  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date;
  });
  const [statusFilter, setStatusFilter] = useState("Todos");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoria || !descricao || !valor || !vencimento) {
      return;
    }

    setSaving(true);
    const success = await createConta({
      categoria: categoria.toUpperCase(),
      descricao,
      valor: parseFloat(valor),
      vencimento: format(vencimento, "yyyy-MM-dd"),
      forma_pagamento: formaPagamento || undefined
    });

    if (success) {
      setCategoria("");
      setDescricao("");
      setValor("");
      setVencimento(undefined);
      setFormaPagamento("");
    }
    setSaving(false);
  };

  const handleFilter = () => {
    fetchContas({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      status: statusFilter
    });
  };

  const handlePagar = async () => {
    if (payingId) {
      await pagarConta(payingId);
      setPayingId(null);
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteConta(deletingId);
      setDeletingId(null);
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
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Pendente</p>
            <p className="text-2xl font-bold text-destructive">
              R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Pago</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Nova Despesa</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div>
                <Label className="text-xs">Categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: COMPRAS"
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
                <Label className="text-xs">Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label className="text-xs">Vencimento</Label>
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
                      onSelect={setVencimento}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs">Forma Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Cadastrar"}
              </Button>
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
                <SelectItem value="Pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleFilter} className="w-full h-9">
              Filtrar
            </Button>
          </div>
        </div>

        {/* Expenses List */}
        {Object.keys(groupedContas).length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            Nenhuma conta encontrada
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {Object.entries(groupedContas).map(([categoryName, categoryContas], index) => {
              const total = categoryContas.reduce((sum, c) => sum + Number(c.valor), 0);
              
              return (
                <AccordionItem key={categoryName} value={`category-${index}`} className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="bg-primary text-primary-foreground px-4 py-2 hover:no-underline hover:bg-primary/90">
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
                              <td className="py-2 px-3 text-sm text-right font-medium">
                                R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-sm">{formatDate(conta.vencimento)}</td>
                              <td className="py-2 px-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  conta.status === "pago" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-destructive/10 text-destructive"
                                )}>
                                  {conta.status === "pago" ? "Pago" : "Pendente"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-center gap-1">
                                  {conta.status === "pendente" && (
                                    <Button
                                      size="icon"
                                      className="h-7 w-7 bg-green-600 hover:bg-green-700"
                                      onClick={() => setPayingId(conta.id)}
                                      title="Marcar como pago"
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

      {/* Confirm Pay Dialog */}
      <AlertDialog open={!!payingId} onOpenChange={() => setPayingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta conta será marcada como paga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePagar} className="bg-green-600 hover:bg-green-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
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
      <ManageContasPagarCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSelectCategory={setCategoria}
      />
    </DashboardLayout>
  );
};

export default ContasPagar;
