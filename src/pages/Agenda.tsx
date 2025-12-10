import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { NoPermission } from "@/components/NoPermission";
import { usePermissions } from "@/hooks/usePermissions";
import { useAgenda, Agendamento, AgendaConfig } from "@/hooks/useAgenda";
import { AgendaConfigDialog } from "@/components/agenda/AgendaConfigDialog";
import { AgendamentoDialog } from "@/components/agenda/AgendamentoDialog";
import { AgendaServicosDialog } from "@/components/agenda/AgendaServicosDialog";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Settings,
  Clock,
  User,
  Phone,
  Mail,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Agenda() {
  const { canView, isLoading: permissionsLoading } = usePermissions();
  const { toast } = useToast();
  const {
    isLoading,
    configs,
    servicos,
    agendamentos,
    dominio,
    createConfig,
    updateConfig,
    deleteConfig,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
    updateServicos,
  } = useAgenda();

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedConfig, setSelectedConfig] = useState<AgendaConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgendaConfig | null>(null);
  const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [servicosDialogOpen, setServicosDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "config" | "agendamento"; id: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [agendaAtiva, setAgendaAtiva] = useState<boolean | null>(null);
  const [checkingAgenda, setCheckingAgenda] = useState(true);

  // Verificar se módulo de agenda está ativo
  useEffect(() => {
    const checkAgendaAtiva = async () => {
      if (!dominio) return;

      try {
        const { data, error } = await supabase.functions.invoke("get-customer-data", {
          body: { dominio },
        });

        if (!error && data?.cliente) {
          setAgendaAtiva(data.cliente.agenda_ativa || false);
        }
      } catch (err) {
        console.error("Erro ao verificar agenda ativa:", err);
      } finally {
        setCheckingAgenda(false);
      }
    };

    checkAgendaAtiva();
  }, [dominio]);

  // Auto select first config
  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      setSelectedConfig(configs[0]);
    }
  }, [configs, selectedConfig]);

  const filteredAgendamentos = useMemo(() => {
    if (!selectedConfig) return [];
    return agendamentos.filter(a => a.agenda_config_id === selectedConfig.id);
  }, [agendamentos, selectedConfig]);

  const agendamentosDodia = useMemo(() => {
    return filteredAgendamentos.filter(a => 
      isSameDay(parseISO(a.data_inicio), selectedDate)
    );
  }, [filteredAgendamentos, selectedDate]);

  const diasComAgendamento = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.filter(day => 
      filteredAgendamentos.some(a => isSameDay(parseISO(a.data_inicio), day))
    );
  }, [filteredAgendamentos, selectedDate]);

  if (permissionsLoading || checkingAgenda) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canView("agenda")) {
    return <NoPermission />;
  }

  // Mostrar tela de ativação se módulo não estiver ativo
  if (!agendaAtiva) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full w-fit mb-4">
                <CalendarIcon className="h-12 w-12 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Módulo de Agenda</CardTitle>
              <CardDescription className="text-base">
                Gerencie sua agenda de serviços e eventos com facilidade. Permita que seus clientes agendem online!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Agenda de Serviços</p>
                    <p className="text-sm text-muted-foreground">Link público para clientes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Agenda de Eventos</p>
                    <p className="text-sm text-muted-foreground">Reuniões e compromissos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Visualização Flexível</p>
                    <p className="text-sm text-muted-foreground">Calendário ou lista</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Configurável</p>
                    <p className="text-sm text-muted-foreground">Horários e intervalos</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-lg font-semibold">+R$ 10,00/mês</p>
                <p className="text-sm text-muted-foreground">Adicional na próxima fatura</p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from("tb_clientes_saas")
                      .update({ agenda_ativa: true })
                      .eq("dominio", dominio);

                    if (error) throw error;

                    setAgendaAtiva(true);
                    toast({
                      title: "Módulo ativado!",
                      description: "O módulo de Agenda foi ativado. O valor será adicionado à sua próxima fatura.",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Erro",
                      description: "Não foi possível ativar o módulo.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Ativar Módulo de Agenda
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleOpenConfigDialog = (config?: AgendaConfig) => {
    setEditingConfig(config || null);
    setConfigDialogOpen(true);
  };

  const handleOpenAgendamentoDialog = (agendamento?: Agendamento) => {
    setEditingAgendamento(agendamento || null);
    setAgendamentoDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "config") {
      await deleteConfig(itemToDelete.id);
      if (selectedConfig?.id === itemToDelete.id) {
        setSelectedConfig(configs.find(c => c.id !== itemToDelete.id) || null);
      }
    } else {
      await deleteAgendamento(itemToDelete.id);
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const copyPublicLink = () => {
    if (!selectedConfig) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/agendar/${selectedConfig.slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link público foi copiado para a área de transferência.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      agendado: "secondary",
      confirmado: "default",
      cancelado: "destructive",
      concluido: "outline",
    };
    const labels: Record<string, string> = {
      agendado: "Agendado",
      confirmado: "Confirmado",
      cancelado: "Cancelado",
      concluido: "Concluído",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Gerencie seus agendamentos e compromissos</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleOpenConfigDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Agenda
            </Button>
            <Button onClick={() => handleOpenAgendamentoDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Config Selector and Actions */}
        {configs.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    value={selectedConfig?.id || ""}
                    onValueChange={(value) => {
                      const config = configs.find(c => c.id === value);
                      setSelectedConfig(config || null);
                    }}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Selecione uma agenda" />
                    </SelectTrigger>
                    <SelectContent>
                      {configs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{config.nome}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {config.tipo === "servicos" ? "Serviços" : "Eventos"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedConfig && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenConfigDialog(selectedConfig)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Configurações</TooltipContent>
                      </Tooltip>

                      {selectedConfig.tipo === "servicos" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setServicosDialogOpen(true)}>
                              <List className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Gerenciar Serviços</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setItemToDelete({ type: "config", id: selectedConfig.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir Agenda</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  {selectedConfig?.tipo === "servicos" && (
                    <Button variant="outline" size="sm" onClick={copyPublicLink}>
                      {copiedLink ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedLink ? "Copiado!" : "Link Público"}
                    </Button>
                  )}

                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "calendar" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma agenda configurada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira agenda para começar a gerenciar seus agendamentos.
              </p>
              <Button onClick={() => handleOpenConfigDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Agenda
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {selectedConfig && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {viewMode === "calendar" && (
              <Card className="lg:col-span-1">
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    modifiers={{
                      hasEvents: diasComAgendamento,
                    }}
                    modifiersStyles={{
                      hasEvents: {
                        backgroundColor: "hsl(var(--primary) / 0.1)",
                        borderRadius: "50%",
                      },
                    }}
                    className="rounded-md border w-full"
                  />
                </CardContent>
              </Card>
            )}

            <Card className={viewMode === "calendar" ? "lg:col-span-2" : "lg:col-span-3"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {viewMode === "calendar" 
                    ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                    : "Todos os Agendamentos"
                  }
                </CardTitle>
                <CardDescription>
                  {viewMode === "calendar" 
                    ? `${agendamentosDodia.length} agendamento(s) neste dia`
                    : `${filteredAgendamentos.length} agendamento(s) no total`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(viewMode === "calendar" ? agendamentosDodia : filteredAgendamentos).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum agendamento {viewMode === "calendar" ? "para este dia" : "encontrado"}</p>
                      </div>
                    ) : (
                      (viewMode === "calendar" ? agendamentosDodia : filteredAgendamentos).map((agendamento) => (
                        <div
                          key={agendamento.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-shrink-0 text-center min-w-[60px]">
                            <p className="text-lg font-bold">{format(parseISO(agendamento.data_inicio), "HH:mm")}</p>
                            <p className="text-xs text-muted-foreground">
                              até {format(parseISO(agendamento.data_fim), "HH:mm")}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{agendamento.titulo}</h4>
                              {getStatusBadge(agendamento.status)}
                            </div>
                            {agendamento.cliente_nome && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{agendamento.cliente_nome}</span>
                              </div>
                            )}
                            {agendamento.cliente_telefone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{agendamento.cliente_telefone}</span>
                              </div>
                            )}
                            {viewMode === "list" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(agendamento.data_inicio), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenAgendamentoDialog(agendamento)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ type: "agendamento", id: agendamento.id });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AgendaConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        config={editingConfig}
        onSave={async (data) => {
          if (editingConfig) {
            await updateConfig(editingConfig.id, data);
          } else {
            await createConfig(data);
          }
          setConfigDialogOpen(false);
        }}
      />

      <AgendamentoDialog
        open={agendamentoDialogOpen}
        onOpenChange={setAgendamentoDialogOpen}
        agendamento={editingAgendamento}
        config={selectedConfig}
        servicos={servicos.filter(s => s.agenda_config_id === selectedConfig?.id)}
        onSave={async (data) => {
          if (editingAgendamento) {
            await updateAgendamento(editingAgendamento.id, data);
          } else {
            await createAgendamento(data);
          }
          setAgendamentoDialogOpen(false);
        }}
        selectedDate={selectedDate}
      />

      {selectedConfig && (
        <AgendaServicosDialog
          open={servicosDialogOpen}
          onOpenChange={setServicosDialogOpen}
          config={selectedConfig}
          servicos={servicos.filter(s => s.agenda_config_id === selectedConfig.id)}
          onSave={(data) => updateServicos(selectedConfig.id, data)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "config"
                ? "Tem certeza que deseja excluir esta agenda? Todos os agendamentos relacionados também serão excluídos."
                : "Tem certeza que deseja excluir este agendamento?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
