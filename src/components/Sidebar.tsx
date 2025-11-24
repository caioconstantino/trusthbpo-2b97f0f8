import { LayoutDashboard, Package, Users, ShoppingCart, ShoppingBag, Wallet, CreditCard, FileText } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";

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

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">GOGARA</h1>
            <p className="text-xs text-muted-foreground">e-compartilha mercas</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 py-6">
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Bem vindo
          </span>
        </div>
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mt-6 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Financeiro
          </span>
        </div>
        <nav className="space-y-1 px-3">
          {financeItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
