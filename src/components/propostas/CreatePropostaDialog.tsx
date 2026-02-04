import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePropostas, PropostaModelo, PropostaBlock } from "@/hooks/usePropostas";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";

interface Cliente {
  id: number;
  razao_social: string;
  email: string;
  telefone: string;
}

interface CreatePropostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelos: PropostaModelo[];
  onCreated: () => void;
}

const defaultLayout: PropostaBlock[] = [
  { id: "header-1", type: "header", content: "Proposta Comercial" },
  { id: "items-1", type: "items" },
  { id: "conditions-1", type: "conditions", content: "Condições de pagamento e entrega a combinar." },
];

export function CreatePropostaDialog({
  open,
  onOpenChange,
  modelos,
  onCreated,
}: CreatePropostaDialogProps) {
  const { createProposta } = usePropostas();
  const { unidadeAtiva } = useUnidadeAtiva();
  const dominio = localStorage.getItem("user_dominio") || "";

  const [titulo, setTitulo] = useState("");
  const [modeloId, setModeloId] = useState<string>("");
  const [clienteId, setClienteId] = useState<string>("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [validadeDias, setValidadeDias] = useState("30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      if (!dominio) return;

      let query = supabase
        .from("tb_clientes")
        .select("id, razao_social, email, telefone")
        .eq("dominio", dominio)
        .order("razao_social");

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data } = await query;
      setClientes(data || []);
    };

    if (open) {
      fetchClientes();
    }
  }, [open, dominio, unidadeAtiva]);

  const handleSubmit = async () => {
    if (!titulo.trim()) return;

    setLoading(true);
    try {
      const selectedModelo = modelos.find((m) => m.id === modeloId);
      const selectedCliente = clientes.find((c) => c.id.toString() === clienteId);

      await createProposta({
        titulo,
        modelo_id: modeloId || null,
        cliente_id: clienteId ? parseInt(clienteId) : null,
        cliente_nome: selectedCliente?.razao_social || null,
        cliente_email: selectedCliente?.email || null,
        cliente_telefone: selectedCliente?.telefone || null,
        layout: selectedModelo?.layout || defaultLayout,
        validade_dias: parseInt(validadeDias),
        status: "rascunho",
      });

      setTitulo("");
      setModeloId("");
      setClienteId("");
      setValidadeDias("30");
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Proposta *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Proposta de Serviços de Consultoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo (opcional)</Label>
            <Select value={modeloId} onValueChange={setModeloId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum (layout padrão)</SelectItem>
                {modelos.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.id}>
                    {modelo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (opcional)</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validade">Validade (dias)</Label>
            <Input
              id="validade"
              type="number"
              min="1"
              value={validadeDias}
              onChange={(e) => setValidadeDias(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!titulo.trim() || loading}>
            {loading ? "Criando..." : "Criar Proposta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
