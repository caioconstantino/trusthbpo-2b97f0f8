import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, Palette } from "lucide-react";

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
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#6366f1");
  const [corSecundaria, setCorSecundaria] = useState("#f5f5f5");
  const [descricaoPublica, setDescricaoPublica] = useState("");

  useEffect(() => {
    if (config) {
      setNome(config.nome);
      setSlug(config.slug);
      setTipo(config.tipo as "servicos" | "eventos");
      setHorarioInicio(config.horario_inicio);
      setHorarioFim(config.horario_fim);
      setIntervaloMinutos(config.intervalo_minutos);
      setDiasFuncionamento(config.dias_funcionamento);
      setLogoUrl(config.logo_url || "");
      setCorPrimaria(config.cor_primaria || "#6366f1");
      setCorSecundaria(config.cor_secundaria || "#f5f5f5");
      setDescricaoPublica(config.descricao_publica || "");
    } else {
      setNome("");
      setSlug("");
      setTipo("servicos");
      setHorarioInicio("08:00");
      setHorarioFim("18:00");
      setIntervaloMinutos(30);
      setDiasFuncionamento([1, 2, 3, 4, 5]);
      setLogoUrl("");
      setCorPrimaria("#6366f1");
      setCorSecundaria("#f5f5f5");
      setDescricaoPublica("");
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
        logo_url: logoUrl || null,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        descricao_publica: descricaoPublica || null,
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

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="marca" className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              Personalização
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="marca" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
              {logoUrl && (
                <div className="mt-2 p-3 border rounded-lg flex justify-center bg-muted/30">
                  <img src={logoUrl} alt="Preview do logo" className="max-h-16 object-contain" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cor_primaria">Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="cor_primaria"
                    value={corPrimaria}
                    onChange={(e) => setCorPrimaria(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={corPrimaria}
                    onChange={(e) => setCorPrimaria(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor_secundaria">Cor de Fundo</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="cor_secundaria"
                    value={corSecundaria}
                    onChange={(e) => setCorSecundaria(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={corSecundaria}
                    onChange={(e) => setCorSecundaria(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_publica">Descrição Pública</Label>
              <Input
                id="descricao_publica"
                value={descricaoPublica}
                onChange={(e) => setDescricaoPublica(e.target.value)}
                placeholder="Texto que aparece na página de agendamento"
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Pré-visualização</Label>
              <div
                className="rounded-lg p-6 text-center border"
                style={{ backgroundColor: corSecundaria }}
              >
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="max-h-12 mx-auto mb-3 object-contain" />
                )}
                <h3 className="font-bold text-lg" style={{ color: corPrimaria }}>
                  {nome || "Nome da Agenda"}
                </h3>
                {descricaoPublica && (
                  <p className="text-sm mt-1 opacity-70">{descricaoPublica}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
