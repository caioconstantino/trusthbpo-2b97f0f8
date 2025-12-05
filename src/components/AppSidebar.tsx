import { LayoutDashboard, Package, Users, ShoppingCart, ShoppingBag, Wallet, CreditCard, FileText } from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.webp";
import { usePermissions } from "@/hooks/usePermissions";

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { canView } = usePermissions();

  const isCollapsed = state === "collapsed";

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: "/dashboard", modulo: "dashboard" },
    { icon: Package, label: t('nav.products'), path: "/produtos", modulo: "produtos" },
    { icon: Users, label: t('nav.customers'), path: "/clientes", modulo: "clientes" },
    { icon: ShoppingCart, label: t('nav.pdv'), path: "/pdv", modulo: "pdv" },
    { icon: ShoppingBag, label: t('nav.purchases'), path: "/compras", modulo: "compras" },
  ];

  const financeItems = [
    { icon: Wallet, label: t('nav.accountsPayable'), path: "/contas-pagar", modulo: "contas_pagar" },
    { icon: CreditCard, label: t('nav.accountsReceivable'), path: "/contas-receber", modulo: "contas_receber" },
    { icon: FileText, label: t('nav.financialCenter'), path: "/central-contas", modulo: "central_contas" },
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
            <SidebarGroupLabel>{t('dashboard.welcome')}</SidebarGroupLabel>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredFinanceItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('financialCenter.title')}</SidebarGroupLabel>
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
    </Sidebar>
  );
}
