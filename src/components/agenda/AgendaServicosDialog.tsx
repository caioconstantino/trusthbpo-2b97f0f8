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
import { Checkbox } from "@/components/ui/checkbox";
import { AgendaConfig, AgendaServico } from "@/hooks/useAgenda";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";

interface Produto {
  id: number;
  nome: string;
  preco_venda: number | null;
}

interface ServicoConfig {
  produto_id: number;
  duracao_minutos: number;
  ativo: boolean;
}

interface AgendaServicosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AgendaConfig;
  servicos: AgendaServico[];
  onSave: (data: ServicoConfig[]) => Promise<boolean>;
}

export function AgendaServicosDialog({
  open,
  onOpenChange,
  config,
  servicos,
  onSave,
}: AgendaServicosDialogProps) {
  const { unidadeAtiva } = useUnidadeAtiva();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServicos, setSelectedServicos] = useState<Map<number, ServicoConfig>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProdutos();
      
      // Initialize selected services from existing config
      const selected = new Map<number, ServicoConfig>();
      servicos.forEach(s => {
        selected.set(s.produto_id, {
          produto_id: s.produto_id,
          duracao_minutos: s.duracao_minutos,
          ativo: s.ativo,
        });
      });
      setSelectedServicos(selected);
    }
  }, [open, servicos]);

  const fetchProdutos = async () => {
    if (!unidadeAtiva) return;
    
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tb_produtos")
        .select("id, nome, preco_venda")
        .eq("dominio", dominio)
        .eq("unidade_id", unidadeAtiva.id)
        .eq("tipo", "Serviço")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServico = (produto: Produto) => {
    const newSelected = new Map(selectedServicos);
    
    if (newSelected.has(produto.id)) {
      newSelected.delete(produto.id);
    } else {
      newSelected.set(produto.id, {
        produto_id: produto.id,
        duracao_minutos: config.intervalo_minutos,
        ativo: true,
      });
    }
    
    setSelectedServicos(newSelected);
  };

  const updateDuracao = (produtoId: number, duracao: number) => {
    const newSelected = new Map(selectedServicos);
    const existing = newSelected.get(produtoId);
    if (existing) {
      newSelected.set(produtoId, { ...existing, duracao_minutos: duracao });
      setSelectedServicos(newSelected);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const servicosData = Array.from(selectedServicos.values());
      const success = await onSave(servicosData);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Serviços da Agenda</DialogTitle>
          <DialogDescription>
            Selecione os serviços (produtos tipo "Serviço") que estarão disponíveis para agendamento.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {produtos.length === 0
                ? "Nenhum produto do tipo 'Serviço' cadastrado."
                : "Nenhum serviço encontrado com este termo."
              }
            </div>
          ) : (
            <div className="divide-y">
              {filteredProdutos.map((produto) => {
                const isSelected = selectedServicos.has(produto.id);
                const servicoConfig = selectedServicos.get(produto.id);

                return (
                  <div
                    key={produto.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleServico(produto)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{produto.nome}</p>
                      {produto.preco_venda && (
                        <p className="text-sm text-muted-foreground">
                          R$ {produto.preco_venda.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {isSelected && servicoConfig && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Duração:</span>
                        <Input
                          type="number"
                          min={15}
                          step={15}
                          value={servicoConfig.duracao_minutos}
                          onChange={(e) => updateDuracao(produto.id, Number(e.target.value))}
                          className="w-20 h-8"
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedServicos.size} serviço(s) selecionado(s)
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
