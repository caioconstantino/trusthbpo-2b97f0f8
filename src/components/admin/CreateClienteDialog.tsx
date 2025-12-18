import { useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateClienteDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateClienteDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dominio: "",
    razao_social: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    status: "Ativo",
    plano: "Básico",
    responsavel: "",
    observacoes: "",
    desconto_acrescimo: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dominio || !formData.razao_social) {
      toast({
        title: "Erro",
        description: "Domínio e Razão Social são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se domínio já existe
      const { data: existingDomain } = await supabase
        .from("tb_clientes_saas")
        .select("id")
        .eq("dominio", formData.dominio)
        .maybeSingle();

      if (existingDomain) {
        toast({
          title: "Erro",
          description: "Este domínio já está em uso.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Calcular próximo pagamento (30 dias)
      const proximoPagamento = new Date();
      proximoPagamento.setDate(proximoPagamento.getDate() + 30);

      const { error } = await supabase.from("tb_clientes_saas").insert({
        dominio: formData.dominio.toLowerCase().trim(),
        razao_social: formData.razao_social.trim(),
        cpf_cnpj: formData.cpf_cnpj || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        status: formData.status,
        plano: formData.plano,
        responsavel: formData.responsavel || null,
        observacoes: formData.observacoes 
          ? `${formData.observacoes}\n\nDesconto/Acréscimo: ${formData.desconto_acrescimo}%`
          : `Desconto/Acréscimo: ${formData.desconto_acrescimo}%`,
        proximo_pagamento: proximoPagamento.toISOString().split("T")[0],
        ultimo_pagamento: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      // Criar unidade Matriz automaticamente
      await supabase.from("tb_unidades").insert({
        dominio: formData.dominio.toLowerCase().trim(),
        nome: "Matriz",
      });

      // Criar grupo Administradores automaticamente
      const { data: grupoData } = await supabase
        .from("tb_grupos_permissao")
        .insert({
          dominio: formData.dominio.toLowerCase().trim(),
          nome: "Administradores",
          descricao: "Grupo com acesso total ao sistema",
        })
        .select()
        .single();

      if (grupoData) {
        const modulos = [
          "Dashboard",
          "PDV",
          "Produtos",
          "Clientes",
          "Compras",
          "Contas a Pagar",
          "Contas a Receber",
          "Central de Contas",
          "Configurações",
          "Agenda",
        ];

        await supabase.from("tb_grupos_permissao_modulos").insert(
          modulos.map((modulo) => ({
            grupo_id: grupoData.id,
            modulo,
            visualizar: true,
            editar: true,
            excluir: true,
          }))
        );
      }

      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });

      setFormData({
        dominio: "",
        razao_social: "",
        cpf_cnpj: "",
        email: "",
        telefone: "",
        status: "Ativo",
        plano: "Básico",
        responsavel: "",
        observacoes: "",
        desconto_acrescimo: "0",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const descontoAcrescimoValue = parseFloat(formData.desconto_acrescimo) || 0;
  const precoBase = formData.plano === "Profissional" ? 99.90 : 39.90;
  const precoFinal = precoBase * (1 + descontoAcrescimoValue / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente SaaS</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Domínio *</Label>
              <Input
                value={formData.dominio}
                onChange={(e) =>
                  setFormData({ ...formData, dominio: e.target.value })
                }
                placeholder="exemplo"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">
                Identificador único do cliente para login
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Razão Social *</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) =>
                  setFormData({ ...formData, razao_social: e.target.value })
                }
                placeholder="Nome da empresa"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">CPF/CNPJ</Label>
              <Input
                value={formData.cpf_cnpj}
                onChange={(e) =>
                  setFormData({ ...formData, cpf_cnpj: e.target.value })
                }
                placeholder="00.000.000/0000-00"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Responsável/Indicação</Label>
              <Input
                value={formData.responsavel}
                onChange={(e) =>
                  setFormData({ ...formData, responsavel: e.target.value })
                }
                placeholder="Nome do responsável ou indicador"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Plano</Label>
              <Select
                value={formData.plano}
                onValueChange={(value) =>
                  setFormData({ ...formData, plano: value })
                }
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Básico">Básico - R$ 39,90/mês</SelectItem>
                  <SelectItem value="Profissional">Profissional - R$ 99,90/mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Desconto/Acréscimo (%)</Label>
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                value={formData.desconto_acrescimo}
                onChange={(e) =>
                  setFormData({ ...formData, desconto_acrescimo: e.target.value })
                }
                placeholder="0"
                className="bg-slate-700/50 border-slate-600 text-white w-32"
              />
              <div className="text-sm text-slate-400">
                <span>Valor base: </span>
                <span className="text-white">
                  {precoBase.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                <span className="mx-2">→</span>
                <span>Valor final: </span>
                <span className={descontoAcrescimoValue < 0 ? "text-green-400" : descontoAcrescimoValue > 0 ? "text-amber-400" : "text-white"}>
                  {precoFinal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Use valores negativos para desconto (ex: -10) ou positivos para acréscimo (ex: 10)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              placeholder="Observações adicionais..."
              className="bg-slate-700/50 border-slate-600 text-white min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Cliente"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
