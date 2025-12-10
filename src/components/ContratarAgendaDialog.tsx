import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContratarAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ContratarAgendaDialog({
  open,
  onOpenChange,
  onSuccess,
}: ContratarAgendaDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleContratar = async () => {
    setIsLoading(true);
    try {
      const dominio = localStorage.getItem("user_dominio");
      if (!dominio) {
        throw new Error("Domínio não encontrado");
      }

      const { error } = await supabase
        .from("tb_clientes_saas")
        .update({ agenda_ativa: true })
        .eq("dominio", dominio);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Módulo Agenda ativado! R$14,90 serão adicionados à sua próxima fatura.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao contratar agenda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao contratar módulo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Módulo Agenda
          </DialogTitle>
          <DialogDescription>
            Gerencie agendamentos de serviços e eventos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Módulo Adicional</p>
                <p className="text-sm text-muted-foreground">Cobrado mensalmente</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">+R$14,90</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Funcionalidades incluídas:</p>
            <ul className="space-y-2">
              {[
                "Agenda de Serviços com link público",
                "Agenda de Eventos para reuniões",
                "Visualização em calendário e lista",
                "Seleção de serviços disponíveis",
                "Configuração de horários e intervalos",
                "Notificação de agendamentos",
                "Integração com WhatsApp",
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Nota:</strong> O valor será adicionado automaticamente à sua próxima fatura mensal.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleContratar} disabled={isLoading}>
            {isLoading ? "Ativando..." : "Ativar Módulo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}