import { Bell, Gift, GraduationCap, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

export const DashboardHeader = () => {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <GraduationCap className="w-4 h-4" />
          Tutorial
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtro Aplicado: Hoje
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          Emissão Fiscal Grátis!
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
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
