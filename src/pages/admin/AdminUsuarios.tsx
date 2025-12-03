import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut,
  Building2,
  UserCog,
  LayoutDashboard,
  Search,
  Eye,
  Pencil
} from "lucide-react";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  dominio: string;
  status: string | null;
  created_at: string | null;
}

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [dominios, setDominios] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dominioFilter, setDominioFilter] = useState("all");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [searchTerm, dominioFilter, usuarios]);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from("tb_usuarios")
        .select("*")
        .order("dominio");

      if (error) throw error;

      setUsuarios(data || []);

      // Get unique domains
      const uniqueDomains = [...new Set(data?.map(u => u.dominio) || [])];
      setDominios(uniqueDomains);
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

  const filterUsuarios = () => {
    let filtered = usuarios;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.nome.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.dominio.toLowerCase().includes(term)
      );
    }

    if (dominioFilter !== "all") {
      filtered = filtered.filter(u => u.dominio === dominioFilter);
    }

    setFilteredUsuarios(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "Ativo") {
      return "bg-green-500/20 text-green-400";
    }
    return "bg-red-500/20 text-red-400";
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
        <div className="max-w-7xl mx-auto flex gap-4">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => navigate("/admin")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => navigate("/admin/clientes")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clientes SaaS
          </Button>
          <Button 
            variant="ghost" 
            className="text-primary bg-primary/10 hover:bg-primary/20"
          >
            <UserCog className="w-4 h-4 mr-2" />
            Usuários
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Usuários do Sistema</h2>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Buscar por nome, email ou domínio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={dominioFilter} onValueChange={setDominioFilter}>
                <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Filtrar por domínio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os domínios</SelectItem>
                  {dominios.map((dominio) => (
                    <SelectItem key={dominio} value={dominio}>
                      {dominio}
                    </SelectItem>
                  ))}
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
                  <TableHead className="text-slate-400">Nome</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Domínio</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Criado em</TableHead>
                  <TableHead className="text-slate-400 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        {usuario.nome}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {usuario.email}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {usuario.dominio}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(usuario.status)}`}>
                          {usuario.status || "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {usuario.created_at 
                          ? new Date(usuario.created_at).toLocaleDateString('pt-BR')
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

export default AdminUsuarios;
