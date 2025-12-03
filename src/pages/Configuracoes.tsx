import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Users,
  Shield,
  Settings,
  Building2,
  Mail,
  Phone,
  Calendar,
  Crown,
  Plus,
  Loader2,
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
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: string | null;
  created_at: string | null;
}

export default function Configuracoes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "empresa");
  const [cliente, setCliente] = useState<ClienteSaas | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDominio, setUserDominio] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user's domain
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from("tb_usuarios")
          .select("dominio")
          .eq("auth_user_id", user.id)
          .single();

        if (!userData) return;
        setUserDominio(userData.dominio);

        // Fetch client data (using edge function since RLS restricts tb_clientes_saas)
        const { data: clienteData } = await supabase.functions.invoke("get-customer-data", {
          body: { dominio: userData.dominio }
        });

        if (clienteData?.cliente) {
          setCliente(clienteData.cliente);
        }

        // Fetch users for this domain
        const { data: usuariosData } = await supabase
          .from("tb_usuarios")
          .select("id, nome, email, status, created_at")
          .eq("dominio", userData.dominio);

        if (usuariosData) {
          setUsuarios(usuariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="empresa" className="gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 py-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
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

          {/* Usuários Tab */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usuários</CardTitle>
                    <CardDescription>Gerencie os usuários do sistema</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo Usuário</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usuarios.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
                  ) : (
                    usuarios.map((usuario) => (
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
                        <div className="flex items-center gap-2">
                          <Badge variant={usuario.status === "Ativo" ? "default" : "secondary"}>
                            {usuario.status || "Ativo"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissões Tab */}
          <TabsContent value="permissoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permissões</CardTitle>
                <CardDescription>Configure as permissões de acesso dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Em breve</p>
                  <p className="text-sm">O sistema de permissões está em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
