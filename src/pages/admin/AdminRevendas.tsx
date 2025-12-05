import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LogOut,
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  Webhook,
  DollarSign,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Loader2,
  Handshake
} from "lucide-react";
import { format } from "date-fns";

interface Revenda {
  id: string;
  nome: string;
  email: string;
  documento: string | null;
  telefone: string | null;
  status: string;
  comissao_percentual: number;
  saldo: number;
  total_ganho: number;
  total_sacado: number;
  created_at: string;
}

const AdminRevendas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editRevenda, setEditRevenda] = useState<Revenda | null>(null);
  const [deleteRevenda, setDeleteRevenda] = useState<Revenda | null>(null);
  const [blockRevenda, setBlockRevenda] = useState<Revenda | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    documento: "",
    telefone: "",
    comissao_percentual: "10",
  });

  const { data: revendas = [], isLoading } = useQuery({
    queryKey: ["admin-revendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_revendas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Revenda[];
    },
  });

  const filteredRevendas = revendas.filter(r =>
    r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      senha: "",
      documento: "",
      telefone: "",
      comissao_percentual: "10",
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      // Criar registro na tabela de revendas
      const { error: insertError } = await supabase
        .from("tb_revendas")
        .insert({
          nome: formData.nome,
          email: formData.email,
          documento: formData.documento || null,
          telefone: formData.telefone?.replace(/\D/g, "") || null,
          comissao_percentual: parseFloat(formData.comissao_percentual) || 10,
          auth_user_id: authData.user?.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Revenda cadastrada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-revendas"] });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRevenda) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("tb_revendas")
        .update({
          nome: formData.nome,
          documento: formData.documento || null,
          telefone: formData.telefone?.replace(/\D/g, "") || null,
          comissao_percentual: parseFloat(formData.comissao_percentual) || 10,
        })
        .eq("id", editRevenda.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Revenda atualizada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-revendas"] });
      setEditRevenda(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!blockRevenda) return;

    const newStatus = blockRevenda.status === "Inativo" ? "Ativo" : "Inativo";

    try {
      const { error } = await supabase
        .from("tb_revendas")
        .update({ status: newStatus })
        .eq("id", blockRevenda.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Revenda ${newStatus === "Inativo" ? "bloqueada" : "desbloqueada"} com sucesso!`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-revendas"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBlockRevenda(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRevenda) return;

    try {
      const { error } = await supabase
        .from("tb_revendas")
        .delete()
        .eq("id", deleteRevenda.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Revenda excluída com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-revendas"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteRevenda(null);
    }
  };

  const openEditDialog = (revenda: Revenda) => {
    setFormData({
      nome: revenda.nome,
      email: revenda.email,
      senha: "",
      documento: revenda.documento || "",
      telefone: revenda.telefone || "",
      comissao_percentual: revenda.comissao_percentual.toString(),
    });
    setEditRevenda(revenda);
  };

  const isActive = (path: string) => location.pathname === path;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin SaaS</h1>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-6 py-2">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto">
          <Button 
            variant="ghost" 
            className={isActive("/admin") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/clientes") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/clientes")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clientes
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/escolas") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/escolas")}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Escolas
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/alunos") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/alunos")}
          >
            <Users className="w-4 h-4 mr-2" />
            Alunos
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/revendas") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
          >
            <Handshake className="w-4 h-4 mr-2" />
            Revendas
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/webhooks") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/webhooks")}
          >
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/financeiro") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/financeiro")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Revendas</h2>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nova Revenda
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">Nome</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Comissão</TableHead>
                  <TableHead className="text-slate-400">Saldo</TableHead>
                  <TableHead className="text-slate-400">Total Ganho</TableHead>
                  <TableHead className="text-slate-400 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredRevendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Nenhuma revenda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRevendas.map((revenda) => (
                    <TableRow key={revenda.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{revenda.nome}</TableCell>
                      <TableCell className="text-slate-300">{revenda.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          revenda.status === "Ativo" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {revenda.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{revenda.comissao_percentual}%</TableCell>
                      <TableCell className="text-green-400 font-medium">{formatCurrency(revenda.saldo)}</TableCell>
                      <TableCell className="text-blue-400 font-medium">{formatCurrency(revenda.total_ganho)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem 
                                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                                onClick={() => openEditDialog(revenda)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem 
                                className="text-amber-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer"
                                onClick={() => setBlockRevenda(revenda)}
                              >
                                {revenda.status === "Inativo" ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Ativar
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Bloquear
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer"
                                onClick={() => setDeleteRevenda(revenda)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Revenda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-slate-300">Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Senha *</Label>
              <Input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
                minLength={6}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">CPF/CNPJ</Label>
                <Input
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
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
              <Label className="text-slate-300">Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.comissao_percentual}
                onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateDialogOpen(false); resetForm(); }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRevenda} onOpenChange={() => { setEditRevenda(null); resetForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Revenda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input
                value={formData.email}
                disabled
                className="bg-slate-700/50 border-slate-600 text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-1">O email não pode ser alterado</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">CPF/CNPJ</Label>
                <Input
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
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
              <Label className="text-slate-300">Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.comissao_percentual}
                onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEditRevenda(null); resetForm(); }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation */}
      <AlertDialog open={!!blockRevenda} onOpenChange={() => setBlockRevenda(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {blockRevenda?.status === "Inativo" ? "Ativar" : "Bloquear"} Revenda
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {blockRevenda?.status === "Inativo" 
                ? `Deseja ativar a revenda "${blockRevenda?.nome}"?`
                : `Deseja bloquear a revenda "${blockRevenda?.nome}"?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockToggle}
              className={blockRevenda?.status === "Inativo" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {blockRevenda?.status === "Inativo" ? "Ativar" : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRevenda} onOpenChange={() => setDeleteRevenda(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Revenda</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir a revenda "{deleteRevenda?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRevendas;
