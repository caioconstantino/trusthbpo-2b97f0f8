import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  Check,
  Loader2,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { format, addMinutes, parseISO, setHours, setMinutes, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaConfig {
  id: string;
  dominio: string;
  unidade_id: number | null;
  tipo: string;
  nome: string;
  slug: string;
  ativo: boolean;
  horario_inicio: string;
  horario_fim: string;
  intervalo_minutos: number;
  dias_funcionamento: number[];
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  descricao_publica: string | null;
}

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
}

interface ClienteSaas {
  razao_social: string;
}

export default function AgendarEventoPublico() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [config, setConfig] = useState<AgendaConfig | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [empresa, setEmpresa] = useState<ClienteSaas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<"data" | "horario" | "dados" | "confirmacao">("data");

  // Form states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duracao, setDuracao] = useState(60);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  useEffect(() => {
    if (slug) {
      fetchAgendaData();
    }
  }, [slug]);

  const fetchAgendaData = async () => {
    try {
      const { data: configData, error: configError } = await supabase
        .from("tb_agenda_config")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .eq("tipo", "eventos")
        .single();

      if (configError || !configData) {
        toast({
          title: "Agenda não encontrada",
          description: "Esta agenda de eventos não existe ou não está disponível.",
          variant: "destructive",
        });
        return;
      }

      setConfig(configData as AgendaConfig);

      const { data: empresaData } = await supabase
        .from("tb_clientes_saas")
        .select("razao_social")
        .eq("dominio", configData.dominio)
        .single();

      if (empresaData) {
        setEmpresa(empresaData);
      }

      const { data: agendamentosData } = await supabase
        .from("tb_agendamentos")
        .select("id, data_inicio, data_fim")
        .eq("agenda_config_id", configData.id)
        .neq("status", "cancelado");

      if (agendamentosData) {
        setAgendamentos(agendamentosData);
      }
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableSlots = useMemo(() => {
    if (!config || !selectedDate) return [];

    const slots: string[] = [];
    const [startHour, startMinute] = config.horario_inicio.split(":").map(Number);
    const [endHour, endMinute] = config.horario_fim.split(":").map(Number);

    let current = setMinutes(setHours(selectedDate, startHour), startMinute);
    const end = setMinutes(setHours(selectedDate, endHour), endMinute);
    const now = new Date();

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, duracao);
      
      if (isAfter(current, now)) {
        const hasConflict = agendamentos.some(a => {
          const aStart = parseISO(a.data_inicio);
          const aEnd = parseISO(a.data_fim);
          return (
            (isAfter(current, aStart) && isBefore(current, aEnd)) ||
            (isAfter(slotEnd, aStart) && isBefore(slotEnd, aEnd)) ||
            (isBefore(current, aStart) && isAfter(slotEnd, aEnd)) ||
            format(current, "HH:mm") === format(aStart, "HH:mm")
          );
        });

        if (!hasConflict) {
          slots.push(format(current, "HH:mm"));
        }
      }

      current = addMinutes(current, config.intervalo_minutos);
    }

    return slots;
  }, [config, selectedDate, duracao, agendamentos]);

  const isDayDisabled = (date: Date) => {
    if (!config) return true;
    
    const dayOfWeek = date.getDay();
    if (!config.dias_funcionamento.includes(dayOfWeek)) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    return false;
  };

  const handleSubmit = async () => {
    if (!config || !selectedDate || !selectedTime || !titulo || !clienteNome || !clienteTelefone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const [hour, minute] = selectedTime.split(":").map(Number);
      const dataInicio = setMinutes(setHours(selectedDate, hour), minute);
      const dataFim = addMinutes(dataInicio, duracao);

      const { error } = await supabase
        .from("tb_agendamentos")
        .insert({
          dominio: config.dominio,
          unidade_id: config.unidade_id,
          agenda_config_id: config.id,
          tipo: "evento",
          titulo: titulo,
          descricao: descricao || null,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          cliente_email: clienteEmail || null,
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          status: "agendado",
        });

      if (error) throw error;

      setStep("confirmacao");
      toast({
        title: "Evento agendado!",
        description: "Você receberá uma confirmação em breve.",
      });
    } catch (error: any) {
      console.error("Erro ao agendar:", error);
      toast({
        title: "Erro ao agendar",
        description: "Não foi possível realizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Agenda não encontrada</h2>
            <p className="text-muted-foreground">
              Esta agenda de eventos não existe ou não está mais disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={!config.cor_secundaria ? "min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8" : "min-h-screen p-4 md:p-8"}
      style={config.cor_secundaria ? {
        background: `linear-gradient(135deg, ${config.cor_secundaria}, ${config.cor_secundaria}dd)`,
      } : undefined}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {config.logo_url && (
            <img src={config.logo_url} alt="Logo" className="max-h-16 mx-auto mb-4 object-contain" />
          )}
          {empresa && !config.logo_url && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span>{empresa.razao_social}</span>
            </div>
          )}
          <h1 className="text-3xl font-bold" style={config.cor_primaria ? { color: config.cor_primaria } : undefined}>
            {config.nome}
          </h1>
          <p className="text-muted-foreground mt-2">
            {config.descricao_publica || "Agende seu evento online"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["data", "horario", "dados"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s || ["data", "horario", "dados"].indexOf(step) > i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {["data", "horario", "dados"].indexOf(step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div className={`w-8 h-0.5 ${
                  ["data", "horario", "dados"].indexOf(step) > i
                    ? "bg-primary"
                    : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          {step === "data" && (
            <>
              <CardHeader>
                <CardTitle>Escolha a Data</CardTitle>
                <CardDescription>Selecione o dia desejado para o evento</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setStep("horario");
                  }}
                  locale={ptBR}
                  disabled={isDayDisabled}
                  className="rounded-md border"
                />
              </CardContent>
            </>
          )}

          {step === "horario" && (
            <>
              <CardHeader>
                <CardTitle>Escolha o Horário</CardTitle>
                <CardDescription>
                  {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="duracao">Duração do evento (minutos)</Label>
                  <Input
                    id="duracao"
                    type="number"
                    value={duracao}
                    onChange={(e) => setDuracao(Number(e.target.value) || 60)}
                    min={15}
                    max={480}
                    step={15}
                    className="mt-1 w-32"
                  />
                </div>

                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum horário disponível para esta data.</p>
                    <Button variant="link" onClick={() => setStep("data")}>
                      Escolher outra data
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : "outline"}
                        onClick={() => {
                          setSelectedTime(slot);
                          setStep("dados");
                        }}
                        className="h-12"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6">
                <Button variant="outline" onClick={() => setStep("data")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </>
          )}

          {step === "dados" && (
            <>
              <CardHeader>
                <CardTitle>Detalhes do Evento</CardTitle>
                <CardDescription>Preencha as informações do evento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime} - {duracao} min
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título do evento *</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Reunião de alinhamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Detalhes sobre o evento..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Seu nome *</Label>
                  <Input
                    id="nome"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </CardContent>
              <div className="px-6 pb-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep("horario")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || !titulo || !clienteNome || !clienteTelefone}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Agendamento
                </Button>
              </div>
            </>
          )}

          {step === "confirmacao" && (
            <>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Evento Agendado!</h2>
                <p className="text-muted-foreground mb-4">
                  {titulo}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Você receberá uma confirmação em breve.
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
