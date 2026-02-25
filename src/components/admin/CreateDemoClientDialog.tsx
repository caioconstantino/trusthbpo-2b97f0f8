import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface CreateDemoClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateDemoClientDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateDemoClientDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dominio: "",
    razao_social: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dominio || !formData.razao_social) {
      toast({
        title: "Erro",
        description: "Domínio e Razão Social são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-demo-client", {
        body: {
          dominio: formData.dominio,
          razao_social: formData.razao_social,
          email: formData.email || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "🎉 Demo criada!",
        description: `Cliente "${formData.razao_social}" criado com produtos, categorias, clientes e contas de exemplo.`,
      });

      setFormData({ dominio: "", razao_social: "", email: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Criar Cliente Demonstração
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Cria um cliente já com dados de exemplo: 20 produtos, 5 categorias, 6 clientes, contas a pagar e receber.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Domínio *</Label>
            <Input
              value={formData.dominio}
              onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
              placeholder="demo-empresa"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Razão Social *</Label>
            <Input
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              placeholder="Empresa Demonstração Ltda"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Email (opcional)</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500">Se informado, envia email de boas-vindas com acesso.</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3 text-sm text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Dados que serão criados:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>5 categorias (Bebidas, Alimentos, Limpeza, Higiene, Diversos)</li>
              <li>20 produtos com preços e estoque</li>
              <li>6 clientes de exemplo</li>
              <li>4 contas a pagar</li>
              <li>3 contas a receber</li>
              <li>Grupo Administradores com permissões completas</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando demo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Demonstração
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
