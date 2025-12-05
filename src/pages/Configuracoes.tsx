import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Shield,
  Settings,
  Building2,
  Mail,
  Phone,
  Calendar,
  Crown,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Users,
  Eye,
  Edit,
  Trash,
  Building,
  MapPin,
  Monitor,
  Minus,
  ExternalLink,
} from "lucide-react";

interface ClienteSaas {
  razao_social: string;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  dominio: string;
  plano: string | null;
  status: string;
  ultimo_pagamento: string | null;
  proximo_pagamento: string | null;
  pdvs_adicionais?: number;
  empresas_adicionais?: number;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: string | null;
  created_at: string | null;
  grupo_id: string | null;
}

interface GrupoPermissao {
  id: string;
  nome: string;
  descricao: string | null;
  dominio: string;
}

interface ModuloPermissao {
  id: string;
  grupo_id: string;
  modulo: string;
  visualizar: boolean;
  editar: boolean;
  excluir: boolean;
}

interface Unidade {
  id: number;
  dominio: string;
  nome: string;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  ativo: boolean;
}

const MODULOS = [
  { id: "dashboard", nome: "Dashboard" },
  { id: "pdv", nome: "PDV" },
  { id: "produtos", nome: "Produtos" },
  { id: "clientes", nome: "Clientes" },
  { id: "compras", nome: "Compras" },
  { id: "contas_pagar", nome: "Contas a Pagar" },
  { id: "contas_receber", nome: "Contas a Receber" },
  { id: "central_contas", nome: "Central de Contas" },
  { id: "configuracoes", nome: "Configurações" },
];

export default function Configuracoes() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "empresa");
  const [cliente, setCliente] = useState<ClienteSaas | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [grupos, setGrupos] = useState<GrupoPermissao[]>([]);
  const [permissoesModulos, setPermissoesModulos] = useState<ModuloPermissao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDominio, setUserDominio] = useState<string | null>(null);

  // Dialog states
  const [grupoDialogOpen, setGrupoDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoPermissao | null>(null);
  const [grupoNome, setGrupoNome] = useState("");
  const [grupoDescricao, setGrupoDescricao] = useState("");
  const [grupoPermissoes, setGrupoPermissoes] = useState<Record<string, { visualizar: boolean; editar: boolean; excluir: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // User edit dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [userNome, setUserNome] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userSenha, setUserSenha] = useState("");
  const [userStatus, setUserStatus] = useState("Ativo");
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Multi-empresa states
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadeDialogOpen, setUnidadeDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);
  const [unidadeNome, setUnidadeNome] = useState("");
  const [unidadeLogradouro, setUnidadeLogradouro] = useState("");
  const [unidadeNumero, setUnidadeNumero] = useState("");
  const [unidadeBairro, setUnidadeBairro] = useState("");
  const [unidadeCidade, setUnidadeCidade] = useState("");
  const [unidadeEstado, setUnidadeEstado] = useState("");
  const [unidadeCep, setUnidadeCep] = useState("");
  const [isSavingUnidade, setIsSavingUnidade] = useState(false);
  
  // Copy data states
  const [copyFromUnidadeId, setCopyFromUnidadeId] = useState<string>("");
  const [copyOptions, setCopyOptions] = useState({
    categoriasProdutos: false,
    produtos: false,
    categoriasContasPagar: false,
    categoriasContasReceber: false,
    clientes: false,
  });

  // PDV states
  const [pdvQuantidade, setPdvQuantidade] = useState(1);
  const [isGeneratingPdvLink, setIsGeneratingPdvLink] = useState(false);
  const [pdvPaymentLink, setPdvPaymentLink] = useState<string | null>(null);
  const PRECO_PDV_ADICIONAL = 1000; // R$ 10,00 em centavos

  // Empresa adicional states
  const [empresaQuantidade, setEmpresaQuantidade] = useState(1);
  const [isGeneratingEmpresaLink, setIsGeneratingEmpresaLink] = useState(false);
  const [empresaPaymentLink, setEmpresaPaymentLink] = useState<string | null>(null);
  const PRECO_EMPRESA_ADICIONAL = 1000; // R$ 10,00 em centavos

  // Calcular empresas incluídas no plano
  const empresasIncluidas = cliente?.plano === "Pro" || cliente?.plano === "R$ 99,90" ? 2 : 1;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("tb_usuarios")
        .select("dominio")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) return;
      setUserDominio(userData.dominio);

      // Fetch client data
      const { data: clienteData } = await supabase.functions.invoke("get-customer-data", {
        body: { dominio: userData.dominio }
      });

      if (clienteData?.cliente) {
        setCliente(clienteData.cliente);
      }

      // Fetch users
      const { data: usuariosData } = await supabase
        .from("tb_usuarios")
        .select("id, nome, email, status, created_at, grupo_id")
        .eq("dominio", userData.dominio);

      if (usuariosData) {
        setUsuarios(usuariosData);
      }

      // Fetch permission groups
      const { data: gruposData } = await supabase
        .from("tb_grupos_permissao")
        .select("*")
        .eq("dominio", userData.dominio);

      if (gruposData) {
        setGrupos(gruposData);
      }

      // Fetch module permissions
      const { data: permissoesData } = await supabase
        .from("tb_grupos_permissao_modulos")
        .select("*");

      if (permissoesData) {
        setPermissoesModulos(permissoesData);
      }

      // Fetch unidades (multi-empresa)
      const { data: unidadesData } = await supabase
        .from("tb_unidades")
        .select("*")
        .eq("dominio", userData.dominio)
        .order("nome");

      if (unidadesData) {
        setUnidades(unidadesData as Unidade[]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const openGrupoDialog = (grupo?: GrupoPermissao) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setGrupoNome(grupo.nome);
      setGrupoDescricao(grupo.descricao || "");
      
      // Load existing permissions
      const perms: Record<string, { visualizar: boolean; editar: boolean; excluir: boolean }> = {};
      MODULOS.forEach(mod => {
        const existingPerm = permissoesModulos.find(p => p.grupo_id === grupo.id && p.modulo === mod.id);
        perms[mod.id] = {
          visualizar: existingPerm?.visualizar || false,
          editar: existingPerm?.editar || false,
          excluir: existingPerm?.excluir || false,
        };
      });
      setGrupoPermissoes(perms);
    } else {
      setEditingGrupo(null);
      setGrupoNome("");
      setGrupoDescricao("");
      const perms: Record<string, { visualizar: boolean; editar: boolean; excluir: boolean }> = {};
      MODULOS.forEach(mod => {
        perms[mod.id] = { visualizar: false, editar: false, excluir: false };
      });
      setGrupoPermissoes(perms);
    }
    setGrupoDialogOpen(true);
  };

  const saveGrupo = async () => {
    if (!grupoNome.trim() || !userDominio) return;

    setIsSaving(true);
    try {
      let grupoId: string;

      if (editingGrupo) {
        // Update existing group
        const { error } = await supabase
          .from("tb_grupos_permissao")
          .update({ nome: grupoNome, descricao: grupoDescricao })
          .eq("id", editingGrupo.id);

        if (error) throw error;
        grupoId = editingGrupo.id;

        // Delete existing permissions
        await supabase
          .from("tb_grupos_permissao_modulos")
          .delete()
          .eq("grupo_id", grupoId);
      } else {
        // Create new group
        const { data, error } = await supabase
          .from("tb_grupos_permissao")
          .insert({ nome: grupoNome, descricao: grupoDescricao, dominio: userDominio })
          .select()
          .single();

        if (error) throw error;
        grupoId = data.id;
      }

      // Insert permissions
      const permissoesToInsert = MODULOS.map(mod => ({
        grupo_id: grupoId,
        modulo: mod.id,
        visualizar: grupoPermissoes[mod.id]?.visualizar || false,
        editar: grupoPermissoes[mod.id]?.editar || false,
        excluir: grupoPermissoes[mod.id]?.excluir || false,
      }));

      const { error: permError } = await supabase
        .from("tb_grupos_permissao_modulos")
        .insert(permissoesToInsert);

      if (permError) throw permError;

      toast({
        title: editingGrupo ? "Grupo atualizado" : "Grupo criado",
        description: `O grupo "${grupoNome}" foi ${editingGrupo ? "atualizado" : "criado"} com sucesso.`,
      });

      setGrupoDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar grupo:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar grupo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGrupo = async (grupo: GrupoPermissao) => {
    if (!confirm(`Deseja excluir o grupo "${grupo.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from("tb_grupos_permissao")
        .delete()
        .eq("id", grupo.id);

      if (error) throw error;

      toast({
        title: "Grupo excluído",
        description: `O grupo "${grupo.nome}" foi excluído.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir grupo.",
        variant: "destructive",
      });
    }
  };

  const openUserDialog = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setUserNome(user.nome);
      setUserEmail(user.email);
      setUserSenha("");
      setUserStatus(user.status || "Ativo");
      setSelectedGrupoId(user.grupo_id || "sem-grupo");
    } else {
      setEditingUser(null);
      setUserNome("");
      setUserEmail("");
      setUserSenha("");
      setUserStatus("Ativo");
      setSelectedGrupoId("sem-grupo");
    }
    setUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!userNome.trim() || !userEmail.trim() || !userDominio) return;

    setIsSavingUser(true);
    try {
      const grupoIdToSave = selectedGrupoId === "sem-grupo" ? null : selectedGrupoId;

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from("tb_usuarios")
          .update({
            nome: userNome,
            email: userEmail,
            status: userStatus,
            grupo_id: grupoIdToSave,
          })
          .eq("id", editingUser.id);

        if (error) throw error;

        toast({
          title: "Usuário atualizado",
          description: "Os dados do usuário foram atualizados.",
        });
      } else {
        // Create new user in Supabase Auth
        if (!userSenha || userSenha.length < 6) {
          toast({
            title: "Erro",
            description: "A senha deve ter pelo menos 6 caracteres.",
            variant: "destructive",
          });
          setIsSavingUser(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userEmail,
          password: userSenha,
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Erro ao criar usuário na autenticação");
        }

        // Create record in tb_usuarios
        const { error: usuarioError } = await supabase.from("tb_usuarios").insert({
          auth_user_id: authData.user.id,
          nome: userNome,
          email: userEmail,
          dominio: userDominio,
          status: userStatus,
          grupo_id: grupoIdToSave,
        });

        if (usuarioError) throw usuarioError;

        toast({
          title: "Usuário criado",
          description: "O novo usuário foi criado com sucesso.",
        });
      }

      setUserDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário.",
        variant: "destructive",
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  const deleteUser = async (user: Usuario) => {
    if (!confirm(`Deseja excluir o usuário "${user.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from("tb_usuarios")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: `O usuário "${user.nome}" foi excluído.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário.",
        variant: "destructive",
      });
    }
  };

  const toggleAllPermissions = (modulo: string, checked: boolean) => {
    setGrupoPermissoes(prev => ({
      ...prev,
      [modulo]: { visualizar: checked, editar: checked, excluir: checked }
    }));
  };

  const getGrupoNome = (grupoId: string | null) => {
    if (!grupoId) return "Sem grupo";
    const grupo = grupos.find(g => g.id === grupoId);
    return grupo?.nome || "—";
  };

  // Multi-empresa functions
  const openUnidadeDialog = (unidade?: Unidade) => {
    if (unidade) {
      setEditingUnidade(unidade);
      setUnidadeNome(unidade.nome);
      setUnidadeLogradouro(unidade.endereco_logradouro || "");
      setUnidadeNumero(unidade.endereco_numero || "");
      setUnidadeBairro(unidade.endereco_bairro || "");
      setUnidadeCidade(unidade.endereco_cidade || "");
      setUnidadeEstado(unidade.endereco_estado || "");
      setUnidadeCep(unidade.endereco_cep || "");
    } else {
      setEditingUnidade(null);
      setUnidadeNome("");
      setUnidadeLogradouro("");
      setUnidadeNumero("");
      setUnidadeBairro("");
      setUnidadeCidade("");
      setUnidadeEstado("");
      setUnidadeCep("");
    }
    // Reset copy options
    setCopyFromUnidadeId("");
    setCopyOptions({
      categoriasProdutos: false,
      produtos: false,
      categoriasContasPagar: false,
      categoriasContasReceber: false,
      clientes: false,
    });
    setUnidadeDialogOpen(true);
  };

  const saveUnidade = async () => {
    if (!unidadeNome.trim() || !userDominio) return;

    setIsSavingUnidade(true);
    try {
      const unidadeData = {
        nome: unidadeNome,
        dominio: userDominio,
        endereco_logradouro: unidadeLogradouro || null,
        endereco_numero: unidadeNumero || null,
        endereco_bairro: unidadeBairro || null,
        endereco_cidade: unidadeCidade || null,
        endereco_estado: unidadeEstado || null,
        endereco_cep: unidadeCep || null,
      };

      if (editingUnidade) {
        const { error } = await supabase
          .from("tb_unidades")
          .update(unidadeData)
          .eq("id", editingUnidade.id);

        if (error) throw error;
      } else {
        const { data: newUnidade, error } = await supabase
          .from("tb_unidades")
          .insert(unidadeData)
          .select()
          .single();

        if (error) throw error;

        // Copy data if source unit is selected
        if (copyFromUnidadeId && copyFromUnidadeId !== "none" && newUnidade) {
          const sourceId = parseInt(copyFromUnidadeId);
          
          // Copy Categorias de Produtos
          if (copyOptions.categoriasProdutos) {
            const { data: categorias } = await supabase
              .from("tb_categorias")
              .select("nome, dominio")
              .eq("unidade_id", sourceId);
            
            if (categorias && categorias.length > 0) {
              await supabase.from("tb_categorias").insert(
                categorias.map(c => ({ ...c, unidade_id: newUnidade.id }))
              );
            }
          }

          // Copy Produtos
          if (copyOptions.produtos) {
            const { data: produtos } = await supabase
              .from("tb_produtos")
              .select("nome, codigo, codigo_barras, preco_custo, preco_venda, observacao, ativo, dominio, tipo, imagem_url")
              .eq("unidade_id", sourceId);
            
            if (produtos && produtos.length > 0) {
              await supabase.from("tb_produtos").insert(
                produtos.map(p => ({ ...p, unidade_id: newUnidade.id, categoria_id: null }))
              );
            }
          }

          // Copy Categorias de Contas a Pagar
          if (copyOptions.categoriasContasPagar) {
            const { data: categorias } = await supabase
              .from("tb_categorias_contas_pagar")
              .select("nome, dominio, edit")
              .eq("unidade_id", sourceId);
            
            if (categorias && categorias.length > 0) {
              await supabase.from("tb_categorias_contas_pagar").insert(
                categorias.map(c => ({ ...c, unidade_id: newUnidade.id, parent_id: null }))
              );
            }
          }

          // Copy Categorias de Contas a Receber
          if (copyOptions.categoriasContasReceber) {
            const { data: categorias } = await supabase
              .from("tb_categorias_contas_receber")
              .select("nome, dominio, edit")
              .eq("unidade_id", sourceId);
            
            if (categorias && categorias.length > 0) {
              await supabase.from("tb_categorias_contas_receber").insert(
                categorias.map(c => ({ ...c, unidade_id: newUnidade.id, parent_id: null }))
              );
            }
          }

          // Copy Clientes
          if (copyOptions.clientes) {
            const { data: clientes } = await supabase
              .from("tb_clientes")
              .select("cpf_cnpj, razao_social, email, telefone, status, observacoes, dominio, responsavel, detalhes_cnpj")
              .eq("unidade_id", sourceId);
            
            if (clientes && clientes.length > 0) {
              await supabase.from("tb_clientes").insert(
                clientes.map(c => ({ ...c, unidade_id: newUnidade.id }))
              );
            }
          }
        }
      }

      toast({
        title: editingUnidade ? "Empresa atualizada" : "Empresa cadastrada",
        description: `A empresa "${unidadeNome}" foi ${editingUnidade ? "atualizada" : "cadastrada"} com sucesso.`,
      });

      setUnidadeDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar empresa.",
        variant: "destructive",
      });
    } finally {
      setIsSavingUnidade(false);
    }
  };

  const deleteUnidade = async (unidade: Unidade) => {
    if (!confirm(`Deseja excluir a empresa "${unidade.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from("tb_unidades")
        .delete()
        .eq("id", unidade.id);

      if (error) throw error;

      toast({
        title: "Empresa excluída",
        description: `A empresa "${unidade.nome}" foi excluída.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa.",
        variant: "destructive",
      });
    }
  };

  const isPro = cliente?.plano?.toLowerCase()?.includes("pro") || cliente?.plano?.toLowerCase()?.includes("profissional");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground text-sm">Gerencie sua conta e preferências</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid w-full h-auto gap-1 ${isPro ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="empresa" className="gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            {isPro && (
              <TabsTrigger value="multiempresa" className="gap-2 py-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Multi-Empresa</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="billing" className="gap-2 py-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="pdvs" className="gap-2 py-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">PDVs</span>
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="gap-2 py-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
          </TabsList>

          {/* Empresa Tab */}
          <TabsContent value="empresa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações cadastrais da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input value={cliente?.razao_social || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ/CPF</Label>
                    <Input value={cliente?.cpf_cnpj || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <div className="flex gap-2">
                      <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
                      <Input value={cliente?.email || ""} disabled className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="flex gap-2">
                      <Phone className="h-4 w-4 mt-3 text-muted-foreground" />
                      <Input value={cliente?.telefone || ""} disabled className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Domínio de Acesso</Label>
                    <Input value={cliente?.dominio || userDominio || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div>
                      <Badge variant={cliente?.status === "Ativo" ? "default" : "secondary"}>
                        {cliente?.status || "—"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multi-Empresa Tab */}
          {isPro && (
            <TabsContent value="multiempresa" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Minhas Empresas
                      </CardTitle>
                      <CardDescription>Gerencie múltiplas empresas no mesmo domínio</CardDescription>
                    </div>
                    <Button size="sm" className="gap-2" onClick={() => openUnidadeDialog()}>
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nova Empresa</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {unidades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Nenhuma empresa cadastrada</p>
                      <p className="text-sm">Cadastre empresas para gerenciar múltiplos negócios</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {unidades.map((unidade) => (
                        <div key={unidade.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{unidade.nome}</p>
                              {(unidade.endereco_cidade || unidade.endereco_estado) && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {[unidade.endereco_cidade, unidade.endereco_estado].filter(Boolean).join(" - ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={unidade.ativo ? "default" : "secondary"}>
                              {unidade.ativo ? "Ativa" : "Inativa"}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => openUnidadeDialog(unidade)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteUnidade(unidade)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contratar Empresas Adicionais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Empresas Incluídas no Plano
                    </CardTitle>
                    <CardDescription>Seu plano atual inclui {empresasIncluidas} empresa{empresasIncluidas > 1 ? "s" : ""}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold mb-2">Plano Básico (R$ 39,90/mês)</h4>
                      <p className="text-sm text-muted-foreground">Inclui 1 empresa</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold mb-2">Plano Pro (R$ 99,90/mês)</h4>
                      <p className="text-sm text-muted-foreground">Inclui 2 empresas</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <h4 className="font-semibold text-primary mb-2">Empresa Adicional</h4>
                      <p className="text-sm text-muted-foreground">
                        Cada empresa adicional custa <span className="font-bold">R$ 10,00/mês</span>
                      </p>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>Você tem:</strong> {unidades.length} empresa{unidades.length !== 1 ? "s" : ""} cadastrada{unidades.length !== 1 ? "s" : ""}
                        {unidades.length > empresasIncluidas && (
                          <span className="block mt-1">
                            ({unidades.length - empresasIncluidas} adicional{unidades.length - empresasIncluidas !== 1 ? "is" : ""} = R$ {((unidades.length - empresasIncluidas) * 10).toFixed(2)}/mês)
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contratar Empresas Adicionais</CardTitle>
                    <CardDescription>Selecione a quantidade de empresas adicionais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Quantidade de Empresas Adicionais</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (empresaQuantidade > 1) {
                              setEmpresaQuantidade(empresaQuantidade - 1);
                              setEmpresaPaymentLink(null);
                            }
                          }}
                          disabled={empresaQuantidade <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={empresaQuantidade}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 1) {
                              setEmpresaQuantidade(value);
                              setEmpresaPaymentLink(null);
                            }
                          }}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEmpresaQuantidade(empresaQuantidade + 1);
                            setEmpresaPaymentLink(null);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total mensal:</span>
                        <span className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((empresaQuantidade * PRECO_EMPRESA_ADICIONAL) / 100)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {empresaQuantidade} empresa{empresaQuantidade > 1 ? "s" : ""} adicional{empresaQuantidade > 1 ? "is" : ""} × R$ 10,00
                      </p>
                    </div>

                    <Button
                      onClick={async () => {
                        setIsGeneratingEmpresaLink(true);
                        setEmpresaPaymentLink(null);
                        try {
                          const totalCentavos = empresaQuantidade * PRECO_EMPRESA_ADICIONAL;
                          const planName = empresaQuantidade === 1 
                            ? "Empresa Adicional - TrustHBPO" 
                            : `${empresaQuantidade}x Empresa Adicional - TrustHBPO`;

                          const { data, error } = await supabase.functions.invoke("pagarme-create-link", {
                            body: { 
                              planName, 
                              planPrice: totalCentavos,
                              dominio: userDominio,
                              tipo: 'empresa_adicional',
                              quantidade: empresaQuantidade
                            }
                          });

                          if (error) throw error;
                          if (data?.paymentLink) {
                            setEmpresaPaymentLink(data.paymentLink);
                            toast({ title: "Link gerado!", description: "Link de pagamento gerado com sucesso." });
                          } else {
                            throw new Error("Link não retornado pela API");
                          }
                        } catch (error) {
                          console.error("Erro ao gerar link:", error);
                          toast({ title: "Erro", description: "Erro ao gerar link de pagamento", variant: "destructive" });
                        } finally {
                          setIsGeneratingEmpresaLink(false);
                        }
                      }}
                      disabled={isGeneratingEmpresaLink}
                      className="w-full"
                    >
                      {isGeneratingEmpresaLink ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando link...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Gerar Link de Pagamento
                        </>
                      )}
                    </Button>

                    {empresaPaymentLink && (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-sm text-green-600 font-medium mb-2">Link gerado com sucesso!</p>
                          <p className="text-xs text-muted-foreground break-all">{empresaPaymentLink}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(empresaPaymentLink);
                              toast({ title: "Copiado!", description: "Link copiado para a área de transferência." });
                            }}
                            className="flex-1"
                          >
                            Copiar Link
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => window.open(empresaPaymentLink, "_blank")}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir Link
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Plano Atual
                </CardTitle>
                <CardDescription>Detalhes da sua assinatura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div>
                    <p className="font-semibold text-lg">{cliente?.plano || "Básico"}</p>
                    <p className="text-sm text-muted-foreground">Seu plano atual</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ativo
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Último Pagamento</p>
                      <p className="font-medium">{formatDate(cliente?.ultimo_pagamento || null)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo Vencimento</p>
                      <p className="font-medium">{formatDate(cliente?.proximo_pagamento || null)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Planos Disponíveis</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-2 border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Básico</CardTitle>
                        <CardDescription>Para pequenos negócios</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">R$ 39,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                          <li>• 1 usuário</li>
                          <li>• PDV completo</li>
                          <li>• Gestão de estoque</li>
                          <li>• Relatórios básicos</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Profissional</CardTitle>
                          <Badge>Popular</Badge>
                        </div>
                        <CardDescription>Para negócios em crescimento</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                          <li>• Usuários ilimitados</li>
                          <li>• Tudo do Básico</li>
                          <li>• Multi-empresa</li>
                          <li>• Relatórios avançados</li>
                          <li>• Suporte prioritário</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDVs Tab */}
          <TabsContent value="pdvs" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Informações sobre PDVs
                  </CardTitle>
                  <CardDescription>Cada plano inclui 1 PDV por padrão</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold mb-2">Plano Básico (R$ 39,90/mês)</h4>
                    <p className="text-sm text-muted-foreground">Inclui 1 PDV</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold mb-2">Plano Pro (R$ 99,90/mês)</h4>
                    <p className="text-sm text-muted-foreground">Inclui 1 PDV</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <h4 className="font-semibold text-primary mb-2">PDV Adicional</h4>
                    <p className="text-sm text-muted-foreground">
                      Cada PDV adicional custa <span className="font-bold">R$ 10,00/mês</span>
                    </p>
                  </div>
                  {(cliente?.pdvs_adicionais || 0) > 0 && (
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>Você tem:</strong> {cliente?.pdvs_adicionais || 0} PDV{(cliente?.pdvs_adicionais || 0) !== 1 ? "s" : ""} adicional{(cliente?.pdvs_adicionais || 0) !== 1 ? "is" : ""} contratado{(cliente?.pdvs_adicionais || 0) !== 1 ? "s" : ""}
                        <span className="block mt-1">
                          (Total: R$ {((cliente?.pdvs_adicionais || 0) * 10).toFixed(2)}/mês)
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generator Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Contratar PDVs Adicionais</CardTitle>
                  <CardDescription>Selecione a quantidade de PDVs adicionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Quantidade de PDVs Adicionais</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (pdvQuantidade > 1) {
                            setPdvQuantidade(pdvQuantidade - 1);
                            setPdvPaymentLink(null);
                          }
                        }}
                        disabled={pdvQuantidade <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={pdvQuantidade}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1) {
                            setPdvQuantidade(value);
                            setPdvPaymentLink(null);
                          }
                        }}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPdvQuantidade(pdvQuantidade + 1);
                          setPdvPaymentLink(null);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total mensal:</span>
                      <span className="text-2xl font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((pdvQuantidade * PRECO_PDV_ADICIONAL) / 100)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pdvQuantidade} PDV{pdvQuantidade > 1 ? "s" : ""} adicional{pdvQuantidade > 1 ? "is" : ""} × R$ 10,00
                    </p>
                  </div>

                  <Button
                    onClick={async () => {
                      setIsGeneratingPdvLink(true);
                      setPdvPaymentLink(null);
                      try {
                        const totalCentavos = pdvQuantidade * PRECO_PDV_ADICIONAL;
                        const planName = pdvQuantidade === 1 
                          ? "PDV Adicional - TrustHBPO" 
                          : `${pdvQuantidade}x PDV Adicional - TrustHBPO`;

                        const { data, error } = await supabase.functions.invoke("pagarme-create-link", {
                          body: { 
                            planName, 
                            planPrice: totalCentavos,
                            dominio: userDominio,
                            tipo: 'pdv_adicional',
                            quantidade: pdvQuantidade
                          }
                        });

                        if (error) throw error;
                        if (data?.paymentLink) {
                          setPdvPaymentLink(data.paymentLink);
                          toast({ title: "Link gerado!", description: "Link de pagamento gerado com sucesso." });
                        } else {
                          throw new Error("Link não retornado pela API");
                        }
                      } catch (error) {
                        console.error("Erro ao gerar link:", error);
                        toast({ title: "Erro", description: "Erro ao gerar link de pagamento", variant: "destructive" });
                      } finally {
                        setIsGeneratingPdvLink(false);
                      }
                    }}
                    disabled={isGeneratingPdvLink}
                    className="w-full"
                  >
                    {isGeneratingPdvLink ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando link...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Gerar Link de Pagamento
                      </>
                    )}
                  </Button>

                  {pdvPaymentLink && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-600 font-medium mb-2">Link gerado com sucesso!</p>
                        <p className="text-xs text-muted-foreground break-all">{pdvPaymentLink}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(pdvPaymentLink);
                            toast({ title: "Copiado!", description: "Link copiado para a área de transferência." });
                          }}
                          className="flex-1"
                        >
                          Copiar Link
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => window.open(pdvPaymentLink, "_blank")}
                          className="flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Abrir Link
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Permissões Tab */}
          <TabsContent value="permissoes" className="space-y-4">
            {/* Grupos de Permissão */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Grupos de Permissão
                    </CardTitle>
                    <CardDescription>Crie grupos e defina as permissões de acesso</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => openGrupoDialog()}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo Grupo</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {grupos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum grupo criado</p>
                    <p className="text-sm">Crie um grupo para definir permissões de acesso</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {grupos.map((grupo) => (
                      <div key={grupo.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{grupo.nome}</p>
                          {grupo.descricao && (
                            <p className="text-sm text-muted-foreground">{grupo.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openGrupoDialog(grupo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteGrupo(grupo)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usuários */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Usuários
                    </CardTitle>
                    <CardDescription>Gerencie os usuários e seus grupos de permissão</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => openUserDialog()}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo Usuário</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usuarios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum usuário encontrado</p>
                    <p className="text-sm">Crie um usuário para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usuarios.map((usuario) => (
                      <div key={usuario.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {usuario.nome?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{usuario.nome}</p>
                            <p className="text-sm text-muted-foreground">{usuario.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={usuario.status === "Ativo" ? "default" : "secondary"}>
                            {usuario.status || "Ativo"}
                          </Badge>
                          <Badge variant="outline">{getGrupoNome(usuario.grupo_id)}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => openUserDialog(usuario)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteUser(usuario)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para criar/editar grupo */}
      <Dialog open={grupoDialogOpen} onOpenChange={setGrupoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGrupo ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
            <DialogDescription>
              Defina o nome do grupo e as permissões para cada módulo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grupoNome">Nome do Grupo</Label>
                <Input
                  id="grupoNome"
                  value={grupoNome}
                  onChange={(e) => setGrupoNome(e.target.value)}
                  placeholder="Ex: Administradores"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grupoDescricao">Descrição</Label>
                <Input
                  id="grupoDescricao"
                  value={grupoDescricao}
                  onChange={(e) => setGrupoDescricao(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Permissões por Módulo</h4>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Módulo</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Visualizar</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Trash className="h-4 w-4" />
                          <span className="hidden sm:inline">Excluir</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[80px]">Todos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULOS.map((modulo) => (
                      <TableRow key={modulo.id}>
                        <TableCell className="font-medium">{modulo.nome}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={grupoPermissoes[modulo.id]?.visualizar || false}
                            onCheckedChange={(checked) => {
                              setGrupoPermissoes(prev => ({
                                ...prev,
                                [modulo.id]: { ...prev[modulo.id], visualizar: !!checked }
                              }));
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={grupoPermissoes[modulo.id]?.editar || false}
                            onCheckedChange={(checked) => {
                              setGrupoPermissoes(prev => ({
                                ...prev,
                                [modulo.id]: { ...prev[modulo.id], editar: !!checked }
                              }));
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={grupoPermissoes[modulo.id]?.excluir || false}
                            onCheckedChange={(checked) => {
                              setGrupoPermissoes(prev => ({
                                ...prev,
                                [modulo.id]: { ...prev[modulo.id], excluir: !!checked }
                              }));
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={
                              grupoPermissoes[modulo.id]?.visualizar &&
                              grupoPermissoes[modulo.id]?.editar &&
                              grupoPermissoes[modulo.id]?.excluir
                            }
                            onCheckedChange={(checked) => toggleAllPermissions(modulo.id, !!checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrupoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveGrupo} disabled={isSaving || !grupoNome.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar/editar usuário */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize os dados do usuário"
                : "Preencha os dados para criar um novo usuário"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userNome">Nome</Label>
              <Input
                id="userNome"
                value={userNome}
                onChange={(e) => setUserNome(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">E-mail</Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={!!editingUser}
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="userSenha">Senha</Label>
                <Input
                  id="userSenha"
                  type="password"
                  value={userSenha}
                  onChange={(e) => setUserSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={userStatus} onValueChange={setUserStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grupo de Permissão</Label>
              <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-grupo">Sem grupo</SelectItem>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveUser}
              disabled={isSavingUser || !userNome.trim() || !userEmail.trim() || (!editingUser && !userSenha)}
            >
              {isSavingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar/editar empresa */}
      <Dialog open={unidadeDialogOpen} onOpenChange={setUnidadeDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnidade ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>
              {editingUnidade
                ? "Atualize os dados da empresa"
                : "Preencha os dados para cadastrar uma nova empresa"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unidadeNome">Nome da Empresa *</Label>
              <Input
                id="unidadeNome"
                value={unidadeNome}
                onChange={(e) => setUnidadeNome(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>

            {/* Copy data section - only for new units */}
            {!editingUnidade && unidades.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Copiar dados de outra empresa (opcional)</p>
                  <div className="space-y-2">
                    <Label>Empresa de origem</Label>
                    <Select value={copyFromUnidadeId} onValueChange={setCopyFromUnidadeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não copiar dados</SelectItem>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {copyFromUnidadeId && copyFromUnidadeId !== "none" && (
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                      <p className="text-sm text-muted-foreground">Selecione o que deseja copiar:</p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="copy-cat-produtos"
                            checked={copyOptions.categoriasProdutos}
                            onCheckedChange={(checked) => 
                              setCopyOptions(prev => ({ ...prev, categoriasProdutos: !!checked }))
                            }
                          />
                          <Label htmlFor="copy-cat-produtos" className="text-sm font-normal cursor-pointer">
                            Categorias de Produtos
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="copy-produtos"
                            checked={copyOptions.produtos}
                            onCheckedChange={(checked) => 
                              setCopyOptions(prev => ({ ...prev, produtos: !!checked }))
                            }
                          />
                          <Label htmlFor="copy-produtos" className="text-sm font-normal cursor-pointer">
                            Produtos
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="copy-cat-pagar"
                            checked={copyOptions.categoriasContasPagar}
                            onCheckedChange={(checked) => 
                              setCopyOptions(prev => ({ ...prev, categoriasContasPagar: !!checked }))
                            }
                          />
                          <Label htmlFor="copy-cat-pagar" className="text-sm font-normal cursor-pointer">
                            Categorias de Contas a Pagar
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="copy-cat-receber"
                            checked={copyOptions.categoriasContasReceber}
                            onCheckedChange={(checked) => 
                              setCopyOptions(prev => ({ ...prev, categoriasContasReceber: !!checked }))
                            }
                          />
                          <Label htmlFor="copy-cat-receber" className="text-sm font-normal cursor-pointer">
                            Categorias de Contas a Receber
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="copy-clientes"
                            checked={copyOptions.clientes}
                            onCheckedChange={(checked) => 
                              setCopyOptions(prev => ({ ...prev, clientes: !!checked }))
                            }
                          />
                          <Label htmlFor="copy-clientes" className="text-sm font-normal cursor-pointer">
                            Clientes
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <p className="text-sm text-muted-foreground">Endereço (opcional)</p>

            <div className="grid gap-4 grid-cols-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="unidadeLogradouro">Logradouro</Label>
                <Input
                  id="unidadeLogradouro"
                  value={unidadeLogradouro}
                  onChange={(e) => setUnidadeLogradouro(e.target.value)}
                  placeholder="Rua, Avenida..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidadeNumero">Número</Label>
                <Input
                  id="unidadeNumero"
                  value={unidadeNumero}
                  onChange={(e) => setUnidadeNumero(e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unidadeBairro">Bairro</Label>
                <Input
                  id="unidadeBairro"
                  value={unidadeBairro}
                  onChange={(e) => setUnidadeBairro(e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidadeCep">CEP</Label>
                <Input
                  id="unidadeCep"
                  value={unidadeCep}
                  onChange={(e) => setUnidadeCep(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unidadeCidade">Cidade</Label>
                <Input
                  id="unidadeCidade"
                  value={unidadeCidade}
                  onChange={(e) => setUnidadeCidade(e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidadeEstado">Estado</Label>
                <Input
                  id="unidadeEstado"
                  value={unidadeEstado}
                  onChange={(e) => setUnidadeEstado(e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnidadeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUnidade} disabled={isSavingUnidade || !unidadeNome.trim()}>
              {isSavingUnidade ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
