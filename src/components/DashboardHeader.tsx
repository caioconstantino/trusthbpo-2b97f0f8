import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, GraduationCap, Settings, LogOut, User, Users, Building2, ChevronDown, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { ReferralDialog } from "./ReferralDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUnidadeAtiva, clearUnidadeCache } from "@/hooks/useUnidadeAtiva";
import { clearPermissionsCache } from "@/hooks/usePermissions";

interface DashboardHeaderProps {
  onTutorialClick?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const DashboardHeader = ({ onTutorialClick }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidadeAtiva, unidades, selecionarUnidade } = useUnidadeAtiva();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  // Mock notifications - in a real app, these would come from the database
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Bem-vindo ao TrustHBPO!",
      message: "Sua conta foi criada com sucesso. Explore o sistema!",
      time: "Agora",
      read: false,
    },
    {
      id: "2",
      title: "Dica do dia",
      message: "Você sabia que pode cadastrar produtos pelo PDV?",
      time: "1h atrás",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      // Limpar caches antes do logout
      clearPermissionsCache();
      clearUnidadeCache();
      
      await supabase.auth.signOut();
      
      // Limpar localStorage
      localStorage.removeItem("user_dominio");
      localStorage.removeItem("user_nome");
      localStorage.removeItem("user_unidades_acesso");
      localStorage.removeItem("unidade_ativa_id");
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Logout realizado com sucesso",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 md:gap-3">
        <SidebarTrigger />
        
        {/* Company Selector */}
        {unidades.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="truncate hidden sm:inline">{unidadeAtiva?.nome || "Selecionar"}</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Trocar Empresa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unidades.map((unidade) => (
                <DropdownMenuItem
                  key={unidade.id}
                  onClick={() => {
                    selecionarUnidade(unidade);
                    toast({
                      title: "Empresa alterada",
                      description: `Agora você está em: ${unidade.nome}`,
                    });
                    window.location.reload();
                  }}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{unidade.nome}</span>
                    {unidade.endereco_cidade && (
                      <span className="text-xs text-muted-foreground">
                        {unidade.endereco_cidade}{unidade.endereco_estado ? `, ${unidade.endereco_estado}` : ''}
                      </span>
                    )}
                  </div>
                  {unidadeAtiva?.id === unidade.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={onTutorialClick}>
          <GraduationCap className="w-4 h-4" />
          <span className="hidden md:inline">Tutorial</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 hidden md:flex border-primary/50 text-primary hover:bg-primary/10"
          onClick={() => setReferralOpen(true)}
        >
          <Users className="w-4 h-4" />
          <span>Indique e Ganhe</span>
        </Button>
        <LanguageSelector />
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Notificações</h4>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">{unreadCount} não lidas</span>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full ${!notification.read ? "bg-primary" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-primary">
                Ver todas
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Empresa</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Empresa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/configuracoes?tab=billing")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Referral Dialog */}
      <ReferralDialog open={referralOpen} onOpenChange={setReferralOpen} />
    </header>
  );
};
