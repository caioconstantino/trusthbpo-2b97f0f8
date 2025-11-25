import { Bell, Gift, GraduationCap, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";

interface DashboardHeaderProps {
  onTutorialClick?: () => void;
}

export const DashboardHeader = ({ onTutorialClick }: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 md:gap-3">
        <SidebarTrigger />
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={onTutorialClick}>
          <GraduationCap className="w-4 h-4" />
          <span className="hidden md:inline">Tutorial</span>
        </Button>
        <Button id="date-filter" variant="outline" size="sm" className="gap-2 hidden lg:flex">
          <Filter className="w-4 h-4" />
          <span className="hidden xl:inline">Filtro Aplicado: Hoje</span>
          <span className="xl:hidden">Hoje</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="default" size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground hidden md:flex">
          <span className="hidden lg:inline">Emissão Fiscal Grátis!</span>
          <span className="lg:hidden">Fiscal</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-2 hidden xl:flex">
          <Gift className="w-4 h-4" />
          Oferta especial para você!
        </Button>
        <div className="relative">
          <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </div>
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
