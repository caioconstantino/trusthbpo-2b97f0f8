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
  Eye,
  Building
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmpresaAdotada {
  id: number;
  dominio: string;
  razao_social: string;
  status: string;
  created_at: string;
}

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  ativo: boolean;
  created_at: string;
  auth_user_id: string | null;
  professor: {
    id: string;
    nome: string;
  } | null;
  escola: {
    id: number;
    nome: string;
  } | null;
  empresa_adotada: EmpresaAdotada | null;
  ultimo_login: string | null;
}

interface Escola {
  id: number;
  nome: string;
}

interface Professor {
  id: string;
  nome: string;
  escola_id: number;
}

const AdminAlunos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEscola, setSelectedEscola] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<string>("all");
  const [viewAluno, setViewAluno] = useState<Aluno | null>(null);

  const { data: escolas = [] } = useQuery({
    queryKey: ["admin-escolas-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_escolas")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data as Escola[];
    },
  });

  const { data: professores = [] } = useQuery({
    queryKey: ["admin-professores-filter", selectedEscola],
    queryFn: async () => {
      let query = supabase
        .from("tb_professores")
        .select("id, nome, escola_id")
        .order("nome");
      
      if (selectedEscola !== "all") {
        query = query.eq("escola_id", parseInt(selectedEscola));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Professor[];
    },
  });

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["admin-alunos", selectedEscola, selectedProfessor],
    queryFn: async () => {
      let query = supabase
        .from("tb_alunos")
        .select(`
          id,
          nome,
          email,
          telefone,
          cpf,
          data_nascimento,
          endereco_cidade,
          endereco_estado,
          endereco_cep,
          endereco_logradouro,
          endereco_numero,
          endereco_complemento,
          endereco_bairro,
          ativo,
          created_at,
          professor_id,
          escola_id,
          auth_user_id
        `)
        .order("created_at", { ascending: false });

      if (selectedEscola !== "all") {
        query = query.eq("escola_id", parseInt(selectedEscola));
      }
      
      if (selectedProfessor !== "all") {
        query = query.eq("professor_id", selectedProfessor);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch professor, escola, empresa adotada and ultimo login
      const alunosWithRelations = await Promise.all(
        (data || []).map(async (aluno: any) => {
          let professor = null;
          let escola = null;
          let empresa_adotada = null;
          let ultimo_login = null;

          if (aluno.professor_id) {
            const { data: profData } = await supabase
              .from("tb_professores")
              .select("id, nome")
              .eq("id", aluno.professor_id)
              .single();
            professor = profData;
          }

          if (aluno.escola_id) {
            const { data: escolaData } = await supabase
              .from("tb_escolas")
              .select("id, nome")
              .eq("id", aluno.escola_id)
              .single();
            escola = escolaData;
          }

          // Buscar empresa adotada pelo aluno
          const { data: empresaData } = await supabase
            .from("tb_clientes_saas")
            .select("id, dominio, razao_social, status, created_at")
            .eq("aluno_id", aluno.id)
            .maybeSingle();
          empresa_adotada = empresaData;

          // Buscar último login da empresa adotada (via edge function)
          if (empresa_adotada) {
            try {
              const { data: loginData } = await supabase.functions.invoke("get-last-login", {
                body: { dominio: empresa_adotada.dominio },
              });
              if (loginData?.last_sign_in_at) {
                ultimo_login = loginData.last_sign_in_at;
              }
            } catch (err) {
              console.error("Erro ao buscar último login:", err);
            }
          }

          return {
            ...aluno,
            professor,
            escola,
            empresa_adotada,
            ultimo_login,
          };
        })
      );

      return alunosWithRelations as Aluno[];
    },
  });

  const filteredAlunos = alunos.filter(
    (aluno) =>
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.cpf?.includes(searchTerm) ||
      aluno.empresa_adotada?.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.empresa_adotada?.dominio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
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
          <h2 className="text-2xl font-bold text-white">Alunos</h2>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {filteredAlunos.length} alunos
          </Badge>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, email, CPF ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <Select value={selectedEscola} onValueChange={(value) => {
                setSelectedEscola(value);
                setSelectedProfessor("all");
              }}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filtrar por escola" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Todas as escolas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id.toString()} className="text-white">
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filtrar por professor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Todos os professores</SelectItem>
                  {professores.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id} className="text-white">
                      {professor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Carregando...</div>
            ) : filteredAlunos.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Escola</TableHead>
                      <TableHead className="text-slate-400">Professor</TableHead>
                      <TableHead className="text-slate-400">Empresa Adotada</TableHead>
                      <TableHead className="text-slate-400">Último Login</TableHead>
                      <TableHead className="text-slate-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlunos.map((aluno) => (
                      <TableRow key={aluno.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">{aluno.nome}</TableCell>
                        <TableCell className="text-slate-300">{aluno.email}</TableCell>
                        <TableCell className="text-slate-300">{aluno.escola?.nome || "-"}</TableCell>
                        <TableCell className="text-slate-300">{aluno.professor?.nome || "-"}</TableCell>
                        <TableCell>
                          {aluno.empresa_adotada ? (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-white text-sm">{aluno.empresa_adotada.razao_social}</p>
                                <p className="text-slate-400 text-xs">{aluno.empresa_adotada.dominio}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Sem empresa</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {aluno.ultimo_login 
                            ? format(new Date(aluno.ultimo_login), "dd/MM/yyyy HH:mm")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => setViewAluno(aluno)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* View Dialog */}
      <Dialog open={!!viewAluno} onOpenChange={() => setViewAluno(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Aluno</DialogTitle>
          </DialogHeader>
          {viewAluno && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Nome</p>
                  <p className="text-white">{viewAluno.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white">{viewAluno.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Telefone</p>
                  <p className="text-white">{formatPhone(viewAluno.telefone)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">CPF</p>
                  <p className="text-white">{formatCPF(viewAluno.cpf)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Data de Nascimento</p>
                  <p className="text-white">
                    {viewAluno.data_nascimento 
                      ? format(new Date(viewAluno.data_nascimento), "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge variant={viewAluno.ativo ? "default" : "secondary"}>
                    {viewAluno.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400 mb-2">Endereço</p>
                <p className="text-white">
                  {viewAluno.endereco_cidade && viewAluno.endereco_estado
                    ? `${viewAluno.endereco_cidade} - ${viewAluno.endereco_estado}`
                    : "-"}
                </p>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Escola</p>
                    <p className="text-white">{viewAluno.escola?.nome || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Professor</p>
                    <p className="text-white">{viewAluno.professor?.nome || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Empresa Adotada Section */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400 mb-2">Empresa Adotada</p>
                {viewAluno.empresa_adotada ? (
                  <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      <span className="text-white font-medium">{viewAluno.empresa_adotada.razao_social}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400">Domínio:</span>
                        <span className="text-white ml-2">{viewAluno.empresa_adotada.dominio}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>
                        <Badge 
                          variant={viewAluno.empresa_adotada.status === "Ativo" ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {viewAluno.empresa_adotada.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-slate-400">Criada em:</span>
                        <span className="text-white ml-2">
                          {format(new Date(viewAluno.empresa_adotada.created_at), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Último login:</span>
                        <span className="text-white ml-2">
                          {viewAluno.ultimo_login 
                            ? format(new Date(viewAluno.ultimo_login), "dd/MM/yyyy HH:mm")
                            : "-"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Nenhuma empresa adotada ainda</p>
                )}
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400">Data de Cadastro</p>
                <p className="text-white">
                  {format(new Date(viewAluno.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAlunos;