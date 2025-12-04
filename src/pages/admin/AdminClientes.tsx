import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign
} from "lucide-react";

interface SaasCliente {
  id: number;
  dominio: string;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  status: string;
  plano: string | null;
  responsavel: string;
  multiempresa: string | null;
  proximo_pagamento: string | null;
  ultimo_pagamento: string | null;
  ultima_forma_pagamento: string | null;
  cupom: string | null;
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

      setClientes(data as SaasCliente[] || []);
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
        c.email.toLowerCase().includes(term)
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

  const isActive = (path: string) => location.pathname === path;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Ativo: "bg-green-500/20 text-green-400",
      Inativo: "bg-red-500/20 text-red-400",
      Lead: "bg-blue-500/20 text-blue-400",
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
                  <TableHead className="text-slate-400">Responsável</TableHead>
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
                      <TableCell className="text-slate-300">
                        {cliente.responsavel || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cliente.proximo_pagamento 
                          ? new Date(cliente.proximo_pagamento).toLocaleDateString('pt-BR')
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
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
    </div>
  );
};

export default AdminClientes;
