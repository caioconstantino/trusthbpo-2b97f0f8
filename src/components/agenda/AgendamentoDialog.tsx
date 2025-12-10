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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Agendamento, AgendaConfig, AgendaServico } from "@/hooks/useAgenda";
import { Loader2 } from "lucide-react";
import { format, addMinutes, parseISO } from "date-fns";

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento | null;
  config: AgendaConfig | null;
  servicos: AgendaServico[];
  onSave: (data: Partial<Agendamento>) => Promise<void>;
  selectedDate?: Date;
}

export function AgendamentoDialog({
  open,
  onOpenChange,
  agendamento,
  config,
  servicos,
  onSave,
  selectedDate,
}: AgendamentoDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [status, setStatus] = useState("agendado");
  const [observacoes, setObservacoes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agendamento) {
      setTitulo(agendamento.titulo);
      setDescricao(agendamento.descricao || "");
      setClienteNome(agendamento.cliente_nome || "");
      setClienteTelefone(agendamento.cliente_telefone || "");
      setClienteEmail(agendamento.cliente_email || "");
      setProdutoId(agendamento.produto_id?.toString() || "");
      setDataInicio(format(parseISO(agendamento.data_inicio), "yyyy-MM-dd"));
      setHoraInicio(format(parseISO(agendamento.data_inicio), "HH:mm"));
      const diffMinutes = Math.round(
        (parseISO(agendamento.data_fim).getTime() - parseISO(agendamento.data_inicio).getTime()) / 60000
      );
      setDuracao(diffMinutes);
      setStatus(agendamento.status);
      setObservacoes(agendamento.observacoes || "");
    } else {
      setTitulo("");
      setDescricao("");
      setClienteNome("");
      setClienteTelefone("");
      setClienteEmail("");
      setProdutoId("");
      setDataInicio(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
      setHoraInicio(config?.horario_inicio || "09:00");
      setDuracao(config?.intervalo_minutos || 60);
      setStatus("agendado");
      setObservacoes("");
    }
  }, [agendamento, config, selectedDate, open]);

  const handleServicoChange = (servicoId: string) => {
    setProdutoId(servicoId);
    const servico = servicos.find(s => s.produto_id.toString() === servicoId);
    if (servico) {
      setTitulo(servico.produto?.nome || "");
      setDuracao(servico.duracao_minutos);
    }
  };

  const handleSave = async () => {
    if (!titulo.trim() || !dataInicio || !horaInicio || !config) return;

    setIsSaving(true);
    try {
      const inicio = new Date(`${dataInicio}T${horaInicio}`);
      const fim = addMinutes(inicio, duracao);

      await onSave({
        agenda_config_id: config.id,
        tipo: config.tipo === "servicos" ? "servico" : "evento",
        titulo,
        descricao: descricao || null,
        cliente_nome: clienteNome || null,
        cliente_telefone: clienteTelefone || null,
        cliente_email: clienteEmail || null,
        produto_id: produtoId ? Number(produtoId) : null,
        data_inicio: inicio.toISOString(),
        data_fim: fim.toISOString(),
        status,
        observacoes: observacoes || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agendamento ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <DialogDescription>
            {config?.tipo === "servicos" ? "Agende um serviço" : "Agende um evento"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {config?.tipo === "servicos" && servicos.length > 0 && (
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={produtoId} onValueChange={handleServicoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.filter(s => s.ativo).map((servico) => (
                    <SelectItem key={servico.produto_id} value={servico.produto_id.toString()}>
                      {servico.produto?.nome} ({servico.duracao_minutos} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Consulta, Reunião..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Horário *</Label>
              <Input
                id="hora"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={String(duracao)} onValueChange={(v) => setDuracao(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
                <SelectItem value="240">4 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente_nome">Nome do Cliente</Label>
            <Input
              id="cliente_nome"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_telefone">Telefone</Label>
              <Input
                id="cliente_telefone"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente_email">E-mail</Label>
              <Input
                id="cliente_email"
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {agendamento && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !titulo.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {agendamento ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
