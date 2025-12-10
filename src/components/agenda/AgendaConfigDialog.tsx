import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgendaConfig } from "@/hooks/useAgenda";
import { Loader2 } from "lucide-react";

interface AgendaConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AgendaConfig | null;
  onSave: (data: Partial<AgendaConfig>) => Promise<void>;
}

const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export function AgendaConfigDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: AgendaConfigDialogProps) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [tipo, setTipo] = useState<"servicos" | "eventos">("servicos");
  const [horarioInicio, setHorarioInicio] = useState("08:00");
  const [horarioFim, setHorarioFim] = useState("18:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState(30);
  const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setNome(config.nome);
      setSlug(config.slug);
      setTipo(config.tipo as "servicos" | "eventos");
      setHorarioInicio(config.horario_inicio);
      setHorarioFim(config.horario_fim);
      setIntervaloMinutos(config.intervalo_minutos);
      setDiasFuncionamento(config.dias_funcionamento);
    } else {
      setNome("");
      setSlug("");
      setTipo("servicos");
      setHorarioInicio("08:00");
      setHorarioFim("18:00");
      setIntervaloMinutos(30);
      setDiasFuncionamento([1, 2, 3, 4, 5]);
    }
  }, [config, open]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 50);
  };

  const handleNomeChange = (value: string) => {
    setNome(value);
    if (!config) {
      setSlug(generateSlug(value) + "-" + Math.random().toString(36).substring(2, 8));
    }
  };

  const toggleDia = (dia: number) => {
    if (diasFuncionamento.includes(dia)) {
      setDiasFuncionamento(diasFuncionamento.filter(d => d !== dia));
    } else {
      setDiasFuncionamento([...diasFuncionamento, dia].sort());
    }
  };

  const handleSave = async () => {
    if (!nome.trim() || !slug.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        nome,
        slug,
        tipo,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        intervalo_minutos: intervaloMinutos,
        dias_funcionamento: diasFuncionamento,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{config ? "Editar Agenda" : "Nova Agenda"}</DialogTitle>
          <DialogDescription>
            Configure os detalhes da sua agenda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Agenda</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Agenda de Consultas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Agenda</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "servicos" | "eventos")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicos">
                  Agenda de Serviços (com link público)
                </SelectItem>
                <SelectItem value="eventos">
                  Agenda de Eventos (reuniões)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horario_inicio">Horário Início</Label>
              <Input
                id="horario_inicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario_fim">Horário Fim</Label>
              <Input
                id="horario_fim"
                type="time"
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intervalo">Intervalo entre Horários</Label>
            <Select value={String(intervaloMinutos)} onValueChange={(v) => setIntervaloMinutos(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dias de Funcionamento</Label>
            <div className="grid grid-cols-4 gap-2">
              {DIAS_SEMANA.map((dia) => (
                <div key={dia.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dia-${dia.value}`}
                    checked={diasFuncionamento.includes(dia.value)}
                    onCheckedChange={() => toggleDia(dia.value)}
                  />
                  <label
                    htmlFor={`dia-${dia.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {dia.label.substring(0, 3)}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !nome.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {config ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
