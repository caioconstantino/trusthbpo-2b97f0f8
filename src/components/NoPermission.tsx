import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function NoPermission() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Você não tem permissão para acessar esta página. Entre em contato com o administrador
        para solicitar acesso.
      </p>
      <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
    </div>
  );
}
