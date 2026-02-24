import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Building2,
} from "lucide-react";
import { format, addMinutes, parseISO, isSameDay, setHours, setMinutes, isAfter, isBefore } from "date-fns";
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

interface AgendaServico {
  id: string;
  agenda_config_id: string;
  produto_id: number;
  duracao_minutos: number;
  ativo: boolean;
  produto: {
    id: number;
    nome: string;
    preco_venda: number | null;
  };
}

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
}

interface ClienteSaas {
  razao_social: string;
}

export default function AgendarPublico() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [config, setConfig] = useState<AgendaConfig | null>(null);
  const [servicos, setServicos] = useState<AgendaServico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [empresa, setEmpresa] = useState<ClienteSaas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<"servico" | "data" | "horario" | "dados" | "confirmacao">("servico");

  // Form states
  const [selectedServico, setSelectedServico] = useState<AgendaServico | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
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
      // Fetch agenda config by slug
      const { data: configData, error: configError } = await supabase
        .from("tb_agenda_config")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .single();

      if (configError || !configData) {
        toast({
          title: "Agenda não encontrada",
          description: "Esta agenda não existe ou não está disponível.",
          variant: "destructive",
        });
        return;
      }

      setConfig(configData as AgendaConfig);

      // Fetch empresa
      const { data: empresaData } = await supabase
        .from("tb_clientes_saas")
        .select("razao_social")
        .eq("dominio", configData.dominio)
        .single();

      if (empresaData) {
        setEmpresa(empresaData);
      }

      // Fetch servicos
      const { data: servicosData } = await supabase
        .from("tb_agenda_servicos")
        .select(`
          *,
          produto:tb_produtos(id, nome, preco_venda)
        `)
        .eq("agenda_config_id", configData.id)
        .eq("ativo", true);

      if (servicosData) {
        setServicos(servicosData as AgendaServico[]);
      }

      // Fetch existing agendamentos for availability check
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

  // Generate available time slots for selected date
  const availableSlots = useMemo(() => {
    if (!config || !selectedDate || !selectedServico) return [];

    const slots: string[] = [];
    const [startHour, startMinute] = config.horario_inicio.split(":").map(Number);
    const [endHour, endMinute] = config.horario_fim.split(":").map(Number);

    let current = setMinutes(setHours(selectedDate, startHour), startMinute);
    const end = setMinutes(setHours(selectedDate, endHour), endMinute);
    const now = new Date();

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, selectedServico.duracao_minutos);
      
      // Check if slot is in the future
      if (isAfter(current, now)) {
        // Check if slot doesn't conflict with existing appointments
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
  }, [config, selectedDate, selectedServico, agendamentos]);

  // Check if a day is available for booking
  const isDayDisabled = (date: Date) => {
    if (!config) return true;
    
    const dayOfWeek = date.getDay();
    if (!config.dias_funcionamento.includes(dayOfWeek)) return true;
    
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    return false;
  };

  const handleSubmit = async () => {
    if (!config || !selectedServico || !selectedDate || !selectedTime || !clienteNome || !clienteTelefone) {
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
      const dataFim = addMinutes(dataInicio, selectedServico.duracao_minutos);

      const { error } = await supabase
        .from("tb_agendamentos")
        .insert({
          dominio: config.dominio,
          unidade_id: config.unidade_id,
          agenda_config_id: config.id,
          tipo: "servico",
          titulo: selectedServico.produto.nome,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          cliente_email: clienteEmail || null,
          produto_id: selectedServico.produto_id,
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          status: "agendado",
        });

      if (error) throw error;

      setStep("confirmacao");
      toast({
        title: "Agendamento realizado!",
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
              Esta agenda não existe ou não está mais disponível.
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
            {config.descricao_publica || "Agende seu horário online"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["servico", "data", "horario", "dados"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s || ["servico", "data", "horario", "dados"].indexOf(step) > i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {["servico", "data", "horario", "dados"].indexOf(step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={`w-8 h-0.5 ${
                  ["servico", "data", "horario", "dados"].indexOf(step) > i
                    ? "bg-primary"
                    : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          {step === "servico" && (
            <>
              <CardHeader>
                <CardTitle>Escolha o Serviço</CardTitle>
                <CardDescription>Selecione o serviço que deseja agendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {servicos.map((servico) => (
                  <button
                    key={servico.id}
                    onClick={() => {
                      setSelectedServico(servico);
                      setStep("data");
                    }}
                    className={`w-full p-4 border rounded-lg text-left hover:border-primary transition-colors ${
                      selectedServico?.id === servico.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{servico.produto.nome}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {servico.duracao_minutos} minutos
                        </p>
                      </div>
                      {servico.produto.preco_venda && (
                        <Badge variant="secondary">
                          R$ {servico.produto.preco_venda.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </>
          )}

          {step === "data" && (
            <>
              <CardHeader>
                <CardTitle>Escolha a Data</CardTitle>
                <CardDescription>Selecione o dia desejado para o agendamento</CardDescription>
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
              <div className="px-6 pb-6">
                <Button variant="outline" onClick={() => setStep("servico")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
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
                <CardTitle>Seus Dados</CardTitle>
                <CardDescription>Preencha suas informações para finalizar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="font-medium">{selectedServico?.produto.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
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
                  disabled={isSaving || !clienteNome || !clienteTelefone}
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
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
              <p className="text-muted-foreground mb-6">
                Seu agendamento foi realizado com sucesso.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg max-w-sm mx-auto text-left space-y-2">
                <p><strong>Serviço:</strong> {selectedServico?.produto.nome}</p>
                <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy")}</p>
                <p><strong>Horário:</strong> {selectedTime}</p>
              </div>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setStep("servico");
                  setSelectedServico(null);
                  setSelectedDate(undefined);
                  setSelectedTime("");
                  setClienteNome("");
                  setClienteTelefone("");
                  setClienteEmail("");
                  fetchAgendaData();
                }}
              >
                Fazer Novo Agendamento
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
