import { useState, useEffect } from "react";
import { LayoutDashboard, Package, Users, ShoppingCart, ShoppingBag, Wallet, CreditCard, FileText, Building2, Sparkles, Gift, Calendar, Lock, FileSignature } from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.webp";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { AdoptCompanyDialog } from "./AdoptCompanyDialog";
import { OfertasEspeciaisDialog } from "./OfertasEspeciaisDialog";
import { ContratarAgendaDialog } from "./ContratarAgendaDialog";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { canView } = usePermissions();
  const [isEducational, setIsEducational] = useState(false);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [adoptDialogOpen, setAdoptDialogOpen] = useState(false);
  const [ofertasDialogOpen, setOfertasDialogOpen] = useState(false);
  const [agendaAtiva, setAgendaAtiva] = useState(false);
  const [contratarAgendaOpen, setContratarAgendaOpen] = useState(false);

  const isCollapsed = state === "collapsed";

  // Verificar se é conta educacional e se agenda está ativa
  useEffect(() => {
    const checkAccountData = async () => {
      const dominio = localStorage.getItem("user_dominio");
      
      if (!dominio) {
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("get-customer-data", {
          body: { dominio },
        });

        if (!error && data?.cliente) {
          setIsEducational(data.cliente.tipo_conta === "aluno");
          setAlunoId(data.cliente.aluno_id);
          setAgendaAtiva(data.cliente.agenda_ativa === true);
        }
      } catch (err) {
        console.error("Erro ao verificar dados da conta:", err);
      }
    };

    checkAccountData();
  }, []);

  const handleAgendaClick = () => {
    if (agendaAtiva) {
      navigate("/agenda");
    } else {
      setContratarAgendaOpen(true);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", modulo: "dashboard" },
    { icon: Package, label: "Produtos", path: "/produtos", modulo: "produtos" },
    { icon: Users, label: "Clientes", path: "/clientes", modulo: "clientes" },
    { icon: ShoppingCart, label: "PDV", path: "/pdv", modulo: "pdv" },
    { icon: ShoppingBag, label: "Compras", path: "/compras", modulo: "compras" },
    { icon: FileSignature, label: "Propostas", path: "/propostas", modulo: "propostas" },
  ];

  const financeItems = [
    { icon: Wallet, label: "Contas a Pagar", path: "/contas-pagar", modulo: "contas_pagar" },
    { icon: CreditCard, label: "Contas a Receber", path: "/contas-receber", modulo: "contas_receber" },
    { icon: FileText, label: "Central de Contas", path: "/central-contas", modulo: "central_contas" },
  ];

  const filteredMenuItems = menuItems.filter(item => canView(item.modulo));
  const filteredFinanceItems = financeItems.filter(item => canView(item.modulo));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <img 
            src={logo} 
            alt="TrustHBPO Logo" 
            className={`${isCollapsed ? 'w-10 h-10' : 'h-12'} object-contain flex-shrink-0`}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Bem-vindo</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={currentPath === item.path}>
                      <NavLink 
                        to={item.path}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {/* Agenda item with lock if not active */}
                {canView("agenda") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={currentPath === "/agenda"}
                      onClick={handleAgendaClick}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="relative">
                        <Calendar className="w-5 h-5" />
                        {!agendaAtiva && (
                          <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-amber-500" />
                        )}
                      </div>
                      <span className="flex items-center gap-2">
                        Agenda
                        {!agendaAtiva && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full font-medium">
                            +R$14,90
                          </span>
                        )}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredFinanceItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Central de Contas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFinanceItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={currentPath === item.path}>
                      <NavLink 
                        to={item.path}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* Botão Ofertas Especiais para todos */}
        <Button
          onClick={() => setOfertasDialogOpen(true)}
          variant="outline"
          className={`w-full border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300 ${
            isCollapsed ? "p-2" : "gap-2"
          }`}
          size={isCollapsed ? "icon" : "default"}
        >
          <Gift className="h-4 w-4" />
          {!isCollapsed && <span className="font-medium">Ofertas Especiais</span>}
        </Button>

        {/* Botão Adote uma Empresa para contas educacionais */}
        {isEducational && alunoId && (
          <Button
            onClick={() => setAdoptDialogOpen(true)}
            className={`w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
              isCollapsed ? "p-2" : "gap-2"
            }`}
            size={isCollapsed ? "icon" : "default"}
          >
            <Sparkles className="h-4 w-4" />
            {!isCollapsed && <span className="font-semibold">Adote uma Empresa</span>}
          </Button>
        )}
      </SidebarFooter>

      <AdoptCompanyDialog
        open={adoptDialogOpen}
        onOpenChange={setAdoptDialogOpen}
        alunoId={alunoId || ""}
      />

      <OfertasEspeciaisDialog
        open={ofertasDialogOpen}
        onOpenChange={setOfertasDialogOpen}
      />

      <ContratarAgendaDialog
        open={contratarAgendaOpen}
        onOpenChange={setContratarAgendaOpen}
        onSuccess={() => {
          setAgendaAtiva(true);
          navigate("/agenda");
        }}
      />
    </Sidebar>
  );
}