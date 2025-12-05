import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Handshake,
  Package,
  Copy,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface Revenda {
  id: string;
  nome: string;
  email: string;
  documento: string | null;
  telefone: string | null;
  status: string;
  slug: string | null;
  created_at: string;
}

interface RevendaProduto {
  id: string;
  revenda_id: string;
  produto_codigo: string;
  produto_nome: string;
  preco_original: number;
  preco_revenda: number;
  ativo: boolean;
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
  const [produtosRevenda, setProdutosRevenda] = useState<Revenda | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    documento: "",
    telefone: "",
    slug: "",
  });

  const [produtosData, setProdutosData] = useState({
    basico_preco: "49.90",
    pro_preco: "129.90",
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

  const { data: produtos = [] } = useQuery({
    queryKey: ["admin-revendas-produtos", produtosRevenda?.id],
    queryFn: async () => {
      if (!produtosRevenda) return [];
      const { data, error } = await supabase
        .from("tb_revendas_produtos")
        .select("*")
        .eq("revenda_id", produtosRevenda.id);
      if (error) throw error;
      return data as RevendaProduto[];
    },
    enabled: !!produtosRevenda,
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
      slug: "",
    });
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const response = await supabase.functions.invoke("create-revenda", {
        body: {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          documento: formData.documento || null,
          telefone: formData.telefone || null,
          slug: formData.slug || generateSlug(formData.nome),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar revenda");
      }

      if (response.data?.error) {
        if (response.data.error.includes("email address has already been registered") || 
            response.data.error.includes("email_exists")) {
          throw new Error("Este email já está cadastrado no sistema. Use outro email.");
        }
        throw new Error(response.data.error);
      }

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
          slug: formData.slug || generateSlug(formData.nome),
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

  const handleSaveProdutos = async () => {
    if (!produtosRevenda) return;
    setIsSubmitting(true);

    try {
      // Upsert produtos
      await supabase.from("tb_revendas_produtos").upsert([
        {
          revenda_id: produtosRevenda.id,
          produto_codigo: "basico",
          produto_nome: "Plano Básico",
          preco_original: 39.90,
          preco_revenda: parseFloat(produtosData.basico_preco) || 49.90,
        },
        {
          revenda_id: produtosRevenda.id,
          produto_codigo: "pro",
          produto_nome: "Plano Pro",
          preco_original: 99.90,
          preco_revenda: parseFloat(produtosData.pro_preco) || 129.90,
        },
      ], { onConflict: 'revenda_id,produto_codigo' });

      toast({
        title: "Sucesso",
        description: "Preços atualizados com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-revendas-produtos"] });
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

  const openEditDialog = (revenda: Revenda) => {
    setFormData({
      nome: revenda.nome,
      email: revenda.email,
      senha: "",
      documento: revenda.documento || "",
      telefone: revenda.telefone || "",
      slug: revenda.slug || "",
    });
    setEditRevenda(revenda);
  };

  const openProdutosDialog = (revenda: Revenda) => {
    setProdutosRevenda(revenda);
    const basicoProduto = produtos.find(p => p.produto_codigo === "basico");
    const proProduto = produtos.find(p => p.produto_codigo === "pro");
    setProdutosData({
      basico_preco: basicoProduto?.preco_revenda?.toString() || "49.90",
      pro_preco: proProduto?.preco_revenda?.toString() || "129.90",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  const isActive = (path: string) => location.pathname === path;

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
                  <TableHead className="text-slate-400">Landing Page</TableHead>
                  <TableHead className="text-slate-400 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredRevendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
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
                      <TableCell>
                        {revenda.slug && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm truncate max-w-[200px]">
                              /revenda/{revenda.slug}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-slate-400 hover:text-white"
                              onClick={() => copyToClipboard(`${window.location.origin}/revenda/${revenda.slug}`)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-slate-400 hover:text-white"
                              onClick={() => window.open(`/revenda/${revenda.slug}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
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
                                onClick={() => openProdutosDialog(revenda)}
                              >
                                <Package className="w-4 h-4 mr-2" />
                                Configurar Preços
                              </DropdownMenuItem>
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
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Revenda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome *</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Nome da revenda"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="email@revenda.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Senha *</Label>
              <Input
                required
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Documento (CPF/CNPJ)</Label>
              <Input
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Slug da Landing Page</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="minha-revenda (auto-gerado se vazio)"
              />
              <p className="text-xs text-slate-500">URL: /revenda/{formData.slug || generateSlug(formData.nome) || "..."}</p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateDialogOpen(false); resetForm(); }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRevenda} onOpenChange={() => { setEditRevenda(null); resetForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Revenda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome *</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                disabled
                value={formData.email}
                className="bg-slate-700/50 border-slate-600 text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Documento (CPF/CNPJ)</Label>
              <Input
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Slug da Landing Page</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEditRevenda(null); resetForm(); }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Produtos/Preços Dialog */}
      <Dialog open={!!produtosRevenda} onOpenChange={() => setProdutosRevenda(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Preços de Revenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Plano Básico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Preço Original:</span>
                  <span className="text-white font-medium">R$ 39,90</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Preço de Revenda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtosData.basico_preco}
                    onChange={(e) => setProdutosData({ ...produtosData, basico_preco: e.target.value })}
                    className="bg-slate-600/50 border-slate-500 text-white"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-600">
                  <span className="text-sm text-slate-400">Lucro por venda:</span>
                  <span className="text-green-400 font-medium">
                    R$ {((parseFloat(produtosData.basico_preco) || 0) - 39.90).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Plano Pro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Preço Original:</span>
                  <span className="text-white font-medium">R$ 99,90</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Preço de Revenda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtosData.pro_preco}
                    onChange={(e) => setProdutosData({ ...produtosData, pro_preco: e.target.value })}
                    className="bg-slate-600/50 border-slate-500 text-white"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-600">
                  <span className="text-sm text-slate-400">Lucro por venda:</span>
                  <span className="text-green-400 font-medium">
                    R$ {((parseFloat(produtosData.pro_preco) || 0) - 99.90).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProdutosRevenda(null)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProdutos} 
                disabled={isSubmitting} 
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Preços"}
              </Button>
            </div>
          </div>
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
              Tem certeza que deseja {blockRevenda?.status === "Inativo" ? "ativar" : "bloquear"} a revenda "{blockRevenda?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockToggle} className="bg-amber-500 hover:bg-amber-600">
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
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRevendas;
