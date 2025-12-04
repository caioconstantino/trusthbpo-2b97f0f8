import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
  Copy,
  Settings
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CreateEscolaDialog } from "@/components/admin/CreateEscolaDialog";
import { ManageProfessoresSheet } from "@/components/admin/ManageProfessoresSheet";

interface Escola {
  id: number;
  nome: string;
  cupom: number;
  email: string | null;
  logo_url: string | null;
  slug: string | null;
  created_at: string | null;
}

const AdminEscolas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);
  const [professoresSheetOpen, setProfessoresSheetOpen] = useState(false);

  const { data: escolas = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-escolas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_escolas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Escola[];
    },
  });

  const filteredEscolas = escolas.filter(
    (escola) =>
      escola.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escola.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const copyLink = (slug: string | null) => {
    if (!slug) {
      toast.error("Esta escola não possui link de cadastro");
      return;
    }
    const link = `${window.location.origin}/cadastro/escola/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const openProfessoresSheet = (escola: Escola) => {
    setSelectedEscola(escola);
    setProfessoresSheetOpen(true);
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
          <h2 className="text-2xl font-bold text-white">Escolas Parceiras</h2>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Escola
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar escola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de Escolas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Carregando...</div>
            ) : filteredEscolas.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Nenhuma escola encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-400">Logo</TableHead>
                    <TableHead className="text-slate-400">Nome</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Link</TableHead>
                    <TableHead className="text-slate-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEscolas.map((escola) => (
                    <TableRow key={escola.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        {escola.logo_url ? (
                          <img 
                            src={escola.logo_url} 
                            alt={escola.nome}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-white font-medium">{escola.nome}</TableCell>
                      <TableCell className="text-slate-300">{escola.email || "-"}</TableCell>
                      <TableCell>
                        {escola.slug ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => copyLink(escola.slug)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </Button>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-white"
                          onClick={() => openProfessoresSheet(escola)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Professores
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateEscolaDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <ManageProfessoresSheet
        escola={selectedEscola}
        open={professoresSheetOpen}
        onOpenChange={setProfessoresSheetOpen}
      />
    </div>
  );
};

export default AdminEscolas;
