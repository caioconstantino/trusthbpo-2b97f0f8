import { LayoutDashboard, Package, Users, ShoppingCart, ShoppingBag, Wallet, CreditCard, FileText } from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";
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

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Produtos", path: "/produtos" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: ShoppingCart, label: "PDV", path: "/pdv" },
  { icon: ShoppingBag, label: "Compras", path: "/compras" },
];

const financeItems = [
  { icon: Wallet, label: "Contas a pagar", path: "/contas-pagar" },
  { icon: CreditCard, label: "Contas a receber", path: "/contas-receber" },
  { icon: FileText, label: "Central de Contas", path: "/central-contas" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-sidebar-foreground truncate">GOGARA</h1>
              <p className="text-xs text-muted-foreground truncate">e-compartilha mercas</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Bem vindo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
