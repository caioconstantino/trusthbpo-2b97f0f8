import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  FileText,
  Briefcase,
  KanbanSquare,
  Receipt,
  LogOut,
} from "lucide-react";

const items = [
  { path: "/admin/educacao", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/educacao/alunos", label: "Alunos", icon: GraduationCap },
  { path: "/admin/educacao/empresas", label: "Empresas", icon: Building2 },
  { path: "/admin/educacao/contratos", label: "Contratos", icon: FileText },
  { path: "/admin/educacao/processos", label: "Processos (Kanban)", icon: KanbanSquare },
  { path: "/admin/educacao/estagios", label: "Estágios ativos", icon: Briefcase },
  { path: "/admin/educacao/faturamento", label: "Faturamento", icon: Receipt },
];

export const EducacaoAdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/educacao/login");
  };

  const isActive = (p: string) =>
    p === "/admin/educacao"
      ? location.pathname === p
      : location.pathname.startsWith(p);

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E0C158] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="font-bold">Educação</h1>
              <p className="text-xs text-slate-400">Painel administrativo</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.path);
            return (
              <button
                key={it.path}
                onClick={() => navigate(it.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
