import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  LogOut,
  Building2,
  LayoutDashboard,
  Search,
  Eye,
  Pencil,
  GraduationCap,
  Users,
  Webhook,
  DollarSign,
  Upload,
  MoreHorizontal,
  Ban,
  CheckCircle,
  Trash2,
  Handshake
} from "lucide-react";
import { ImportClientesDialog } from "@/components/admin/ImportClientesDialog";
import { ViewClienteDialog } from "@/components/admin/ViewClienteDialog";
import { EditClienteSheet } from "@/components/admin/EditClienteSheet";

interface SaasCliente {
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
  ultima_forma_pagamento: string | null;
  cupom: string | null;
  total_vendas?: number;
  created_at: string | null;
  tipo_conta: string | null;
  last_login_at: string | null;
  observacoes: string | null;
}

const AdminClientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<SaasCliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<SaasCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Estados para dialogs
  const [viewCliente, setViewCliente] = useState<SaasCliente | null>(null);
  const [editCliente, setEditCliente] = useState<SaasCliente | null>(null);
  const [deleteCliente, setDeleteCliente] = useState<SaasCliente | null>(null);
  const [blockCliente, setBlockCliente] = useState<SaasCliente | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    filterClientes();
  }, [searchTerm, statusFilter, clientes]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("tb_clientes_saas")
        .select("*")
        .order("razao_social");

      if (error) throw error;

      // Buscar total de vendas por domínio
      const { data: vendas } = await supabase
        .from("tb_vendas")
        .select("dominio, total");

      // Agrupar vendas por domínio
      const vendasPorDominio: Record<string, number> = {};
      vendas?.forEach(v => {
        vendasPorDominio[v.dominio] = (vendasPorDominio[v.dominio] || 0) + Number(v.total);
      });

      // Adicionar total de vendas a cada cliente
      const clientesComVendas = (data || []).map(cliente => ({
        ...cliente,
        total_vendas: vendasPorDominio[cliente.dominio] || 0,
      }));

      setClientes(clientesComVendas as SaasCliente[]);
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

  const filterClientes = () => {
    let filtered = clientes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.dominio.toLowerCase().includes(term) ||
        c.razao_social.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredClientes(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleBlockToggle = async () => {
    if (!blockCliente) return;

    const newStatus = blockCliente.status === "Suspenso" ? "Ativo" : "Suspenso";

    try {
      const { error } = await supabase
        .from("tb_clientes_saas")
        .update({ status: newStatus })
        .eq("id", blockCliente.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Cliente ${newStatus === "Suspenso" ? "bloqueado" : "desbloqueado"} com sucesso!`,
      });

      fetchClientes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBlockCliente(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteCliente) return;

    try {
      const { error } = await supabase
        .from("tb_clientes_saas")
        .delete()
        .eq("id", deleteCliente.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });

      fetchClientes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteCliente(null);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Ativo: "bg-green-500/20 text-green-400",
      Inativo: "bg-red-500/20 text-red-400",
      Lead: "bg-blue-500/20 text-blue-400",
      Suspenso: "bg-amber-500/20 text-amber-400",
      Cancelado: "bg-red-500/20 text-red-400",
      Inadimplente: "bg-orange-500/20 text-orange-400",
    };
    return styles[status] || "bg-slate-500/20 text-slate-400";
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
            onClick={() => navigate("/admin/revendas")}
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
          <h2 className="text-2xl font-bold text-white">Clientes SaaS</h2>
          <Button onClick={() => setImportDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Importar XLSX
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Buscar por domínio, razão social ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativos</SelectItem>
                  <SelectItem value="Inativo">Inativos</SelectItem>
                  <SelectItem value="Lead">Leads</SelectItem>
                  <SelectItem value="Suspenso">Suspensos</SelectItem>
                  <SelectItem value="Cancelado">Cancelados</SelectItem>
                  <SelectItem value="Inadimplente">Inadimplentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-400">Domínio</TableHead>
                  <TableHead className="text-slate-400">Razão Social</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Plano</TableHead>
                  <TableHead className="text-slate-400">Total Vendas</TableHead>
                  <TableHead className="text-slate-400">Próx. Pagamento</TableHead>
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
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        {cliente.dominio}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cliente.razao_social}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(cliente.status)}`}>
                          {cliente.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cliente.plano || "-"}
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cliente.total_vendas || 0)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cliente.proximo_pagamento 
                          ? new Date(cliente.proximo_pagamento).toLocaleDateString('pt-BR')
                          : "-"
                        }
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
                                onClick={() => setViewCliente(cliente)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                                onClick={() => setEditCliente(cliente)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem 
                                className="text-amber-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer"
                                onClick={() => setBlockCliente(cliente)}
                              >
                                {cliente.status === "Suspenso" ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Desbloquear
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
                                onClick={() => setDeleteCliente(cliente)}
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

      {/* Dialogs */}
      <ImportClientesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchClientes}
      />

      <ViewClienteDialog
        open={!!viewCliente}
        onOpenChange={() => setViewCliente(null)}
        cliente={viewCliente}
      />

      <EditClienteSheet
        open={!!editCliente}
        onOpenChange={() => setEditCliente(null)}
        cliente={editCliente}
        onSuccess={fetchClientes}
      />

      {/* Block Confirmation Dialog */}
      <AlertDialog open={!!blockCliente} onOpenChange={() => setBlockCliente(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {blockCliente?.status === "Suspenso" ? "Desbloquear" : "Bloquear"} Cliente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {blockCliente?.status === "Suspenso" 
                ? `Tem certeza que deseja desbloquear o cliente "${blockCliente?.razao_social}"? O acesso ao sistema será restaurado.`
                : `Tem certeza que deseja bloquear o cliente "${blockCliente?.razao_social}"? O acesso ao sistema será suspenso.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockToggle}
              className={blockCliente?.status === "Suspenso" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {blockCliente?.status === "Suspenso" ? "Desbloquear" : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCliente} onOpenChange={() => setDeleteCliente(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir o cliente "{deleteCliente?.razao_social}"? 
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminClientes;
