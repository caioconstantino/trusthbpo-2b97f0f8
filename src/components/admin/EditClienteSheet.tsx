import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2, KeyRound, Eye, EyeOff, UserPlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Cliente {
  id: number;
  dominio: string;
  razao_social: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  status: string;
  plano: string | null;
  responsavel: string | null;
  multiempresa: string | null;
  proximo_pagamento: string | null;
  ultimo_pagamento: string | null;
  cupom: string | null;
  observacoes: string | null;
}

interface EditClienteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onSuccess: () => void;
}

export function EditClienteSheet({ open, onOpenChange, cliente, onSuccess }: EditClienteSheetProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    razao_social: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    status: "",
    plano: "",
    responsavel: "",
    multiempresa: "",
    proximo_pagamento: "",
    cupom: "",
    observacoes: "",
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [_masterPassword, _setMasterPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Create user states
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserPassword, setCreateUserPassword] = useState("");
  const [createUserNome, setCreateUserNome] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createMasterPassword, setCreateMasterPassword] = useState("");

  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Check if domain has existing user
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    if (cliente) {
      checkExistingUser(cliente.dominio);
    }
  }, [cliente]);

  const checkExistingUser = async (dominio: string) => {
    const { data } = await supabase
      .from("tb_usuarios")
      .select("id")
      .eq("dominio", dominio)
      .limit(1);
    setHasUser(!!(data && data.length > 0));
  };

  useEffect(() => {
    if (cliente) {
      setFormData({
        razao_social: cliente.razao_social || "",
        cpf_cnpj: cliente.cpf_cnpj || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        status: cliente.status || "",
        plano: cliente.plano || "",
        responsavel: cliente.responsavel || "",
        multiempresa: cliente.multiempresa || "Não",
        proximo_pagamento: cliente.proximo_pagamento || "",
        cupom: cliente.cupom || "",
        observacoes: cliente.observacoes || "",
      });
    }
  }, [cliente]);

  const handleChangePassword = async () => {
    if (!cliente || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-change-password", {
        body: {
          dominio: cliente.dominio,
          nova_senha: newPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Sucesso", description: `Senha alterada com sucesso para o domínio ${cliente.dominio}` });
      setShowPasswordDialog(false);
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateUser = async () => {
    if (!cliente || !createUserEmail || !createUserPassword) return;

    if (createUserPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-change-password", {
        body: {
          action: "create_user",
          dominio: cliente.dominio,
          email: createUserEmail,
          nova_senha: createUserPassword,
          nome: createUserNome || createUserEmail,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Sucesso", description: `Usuário ${createUserEmail} criado com sucesso para o domínio ${cliente.dominio}` });
      setShowCreateUserDialog(false);
      setCreateUserEmail("");
      setCreateUserPassword("");
      setCreateUserNome("");
      setHasUser(true);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!cliente) return;
    
    if (!confirm(`Tem certeza que deseja excluir o usuário de acesso do domínio "${cliente.dominio}"? Esta ação não pode ser desfeita.`)) return;

    setIsDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-change-password", {
        body: {
          action: "delete_user",
          dominio: cliente.dominio,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Sucesso", description: `Usuário excluído com sucesso do domínio ${cliente.dominio}` });
      setHasUser(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingUser(false);
    }
  };

    e.preventDefault();
    if (!cliente) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("tb_clientes_saas")
        .update({
          razao_social: formData.razao_social,
          cpf_cnpj: formData.cpf_cnpj || null,
          email: formData.email || null,
          telefone: formData.telefone?.replace(/\D/g, "") || null,
          status: formData.status,
          plano: formData.plano || null,
          responsavel: formData.responsavel || null,
          multiempresa: formData.multiempresa || "Não",
          proximo_pagamento: formData.proximo_pagamento || null,
          cupom: formData.cupom || null,
          observacoes: formData.observacoes || null,
        })
        .eq("id", cliente.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
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

  if (!cliente) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-800 border-slate-700 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">Editar Cliente</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label className="text-slate-300">Domínio</Label>
            <Input
              value={cliente.dominio}
              disabled
              className="bg-slate-700/50 border-slate-600 text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-1">O domínio não pode ser alterado</p>
          </div>

          <div>
            <Label className="text-slate-300">Razão Social *</Label>
            <Input
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              required
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">CPF/CNPJ</Label>
              <Input
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Responsável</Label>
            <Input
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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
            <div>
              <Label className="text-slate-300">Plano</Label>
              <Select value={formData.plano} onValueChange={(v) => setFormData({ ...formData, plano: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Básico">Básico</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Educacional">Educacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Multiempresa</Label>
              <Select value={formData.multiempresa} onValueChange={(v) => setFormData({ ...formData, multiempresa: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não">Não</SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Cupom</Label>
              <Input
                value={formData.cupom}
                onChange={(e) => setFormData({ ...formData, cupom: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Próximo Pagamento</Label>
            <Input
              type="date"
              value={formData.proximo_pagamento}
              onChange={(e) => setFormData({ ...formData, proximo_pagamento: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white min-h-[80px]"
            />
          </div>

          {/* Credenciais de Acesso */}
          <div className="pt-2 border-t border-slate-600 space-y-2">
            <p className="text-sm font-medium text-slate-300">Credenciais de Acesso</p>
            {hasUser === false && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateUserEmail(formData.email);
                  setCreateUserNome(formData.razao_social);
                  setShowCreateUserDialog(true);
                }}
                className="w-full border-green-600 text-green-400 hover:bg-green-900/30 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Criar Usuário de Acesso
              </Button>
            )}
            {hasUser && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
                className="w-full border-amber-600 text-amber-400 hover:bg-amber-900/30 gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Alterar Senha do Cliente
              </Button>
            )}
            {hasUser && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className="w-full border-red-600 text-red-400 hover:bg-red-900/30 gap-2"
              >
                {isDeletingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Excluir Usuário de Acesso
              </Button>
            )}
            {hasUser === null && (
              <p className="text-xs text-slate-500">Verificando credenciais...</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>

      {/* Dialog de Alterar Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Alterar Senha - {cliente?.dominio}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300">Nova Senha do Cliente</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowPasswordDialog(false); setNewPassword(""); }}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar Usuário */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-400" />
              Criar Usuário - {cliente?.dominio}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300">Nome</Label>
              <Input
                value={createUserNome}
                onChange={(e) => setCreateUserNome(e.target.value)}
                placeholder="Nome do usuário"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email de Login *</Label>
              <Input
                type="email"
                value={createUserEmail}
                onChange={(e) => setCreateUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Senha *</Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  value={createUserPassword}
                  onChange={(e) => setCreateUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
           </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCreateUserDialog(false); setCreateUserPassword(""); }}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreatingUser || !createUserEmail || !createUserPassword}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
