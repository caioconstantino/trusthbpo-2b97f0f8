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
import { CalendarIcon, List, Plus, Pencil, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CategoryListDialog } from "@/components/CategoryListDialog";
import { ManageCategoryDialog } from "@/components/ManageCategoryDialog";

interface Expense {
  id: number;
  description: string;
  value: number;
  dueDate: string;
  status: "Pago" | "Pendente";
  category: string;
}

const ContasPagar = () => {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [type, setType] = useState("Despesa Única");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryListOpen, setCategoryListOpen] = useState(false);
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);

  const expenses: Expense[] = [
    { id: 508, description: "SALARIO CAIO", value: 100.00, dueDate: "20/10/2025", status: "Pago", category: "SALARIO COLABORADORES" },
  ];

  const groupedExpenses = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description || !value || !dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Despesa cadastrada!",
      description: "A despesa foi adicionada com sucesso.",
    });

    // Reset form
    setCategory("");
    setDescription("");
    setValue("");
    setDueDate(undefined);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Nova despesa</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Categoria */}
              <div>
                <Label>Categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Categoria"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="icon" 
                    className="bg-slate-700 hover:bg-slate-800 text-white"
                    onClick={() => setCategoryListOpen(true)}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button 
                    type="button" 
                    size="icon"
                    onClick={() => {
                      setEditingCategory(null);
                      setManageCategoryOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label>Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição"
                  className="mt-1"
                />
              </div>

              {/* Valor */}
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>

              {/* Data do vencimento */}
              <div>
                <Label>Data do vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className="pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo */}
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Despesa Única">Despesa Única</SelectItem>
                    <SelectItem value="Despesa Recorrente">Despesa Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Cadastrar
              </Button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Início */}
          <div>
            <Label>Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Final */}
          <div>
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtrar */}
          <div className="flex items-end">
            <Button className="w-full bg-slate-700 hover:bg-slate-800">
              Filtrar
            </Button>
          </div>
        </div>

        {/* Expenses List */}
        <Accordion type="single" collapsible className="space-y-4">
          {Object.entries(groupedExpenses).map(([categoryName, categoryExpenses], index) => {
            const total = categoryExpenses.reduce((sum, exp) => sum + exp.value, 0);
            
            return (
              <AccordionItem key={categoryName} value={`category-${index}`} className="border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="bg-dataSection text-dataSection-foreground px-4 py-3 hover:no-underline hover:bg-dataSection/90">
                  <span className="font-semibold uppercase">
                    {categoryName} - TOTAL: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </AccordionTrigger>
                
                <AccordionContent className="bg-card pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">#</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Descrição</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Valor</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Vencimento</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Status</th>
                          <th className="text-center py-3 px-2 md:px-4 font-semibold text-xs md:text-sm w-24 md:w-32">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryExpenses.map((expense) => (
                          <tr key={expense.id} className="border-t">
                            <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{expense.id}</td>
                            <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{expense.description}</td>
                            <td className="py-3 px-2 md:px-4 text-xs md:text-sm">
                              R$ {expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{expense.dueDate}</td>
                            <td className="py-3 px-2 md:px-4">
                              <span className={cn(
                                "px-2 md:px-3 py-1 rounded-full text-xs font-medium",
                                expense.status === "Pago" 
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                {expense.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 md:px-4">
                              <div className="flex items-center justify-center gap-1 md:gap-2">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7 md:h-8 md:w-8 bg-slate-700 hover:bg-slate-800 text-white"
                                >
                                  <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7 md:h-8 md:w-8 bg-slate-600 hover:bg-slate-700 text-white"
                                >
                                  <Lock className="w-3 h-3 md:w-4 md:h-4" />
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
      </div>

      {/* Category Dialogs */}
      <CategoryListDialog
        open={categoryListOpen}
        onOpenChange={setCategoryListOpen}
        onSelectCategory={(cat) => setCategory(cat)}
        onEditCategory={(cat) => {
          setEditingCategory(cat);
          setManageCategoryOpen(true);
        }}
        onDeleteCategory={(id) => {
          toast({
            title: "Categoria excluída!",
            description: "A categoria foi removida com sucesso.",
          });
        }}
      />

      <ManageCategoryDialog
        open={manageCategoryOpen}
        onOpenChange={setManageCategoryOpen}
        editingCategory={editingCategory}
      />
    </DashboardLayout>
  );
};

export default ContasPagar;
