import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  status: string;
  observacoes: string;
}

interface EditCustomerSheetProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditCustomerSheet = ({ customer, open, onOpenChange, onSuccess }: EditCustomerSheetProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    razao_social: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    status: "Ativo",
    observacoes: ""
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        razao_social: customer.razao_social || "",
        cpf_cnpj: customer.cpf_cnpj || "",
        email: customer.email || "",
        telefone: customer.telefone || "",
        status: customer.status || "Ativo",
        observacoes: customer.observacoes || ""
      });
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("tb_clientes")
        .update({
          razao_social: formData.razao_social,
          cpf_cnpj: formData.cpf_cnpj,
          email: formData.email,
          telefone: formData.telefone,
          status: formData.status,
          observacoes: formData.observacoes
        })
        .eq("id", customer.id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Cliente</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="edit-social-name" className="text-xs text-muted-foreground">
              Razão Social / Nome
            </Label>
            <Input
              id="edit-social-name"
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-cpf-cnpj" className="text-xs text-muted-foreground">
              CPF/CNPJ
            </Label>
            <Input
              id="edit-cpf-cnpj"
              value={formData.cpf_cnpj}
              onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone" className="text-xs text-muted-foreground">
                Telefone
              </Label>
              <Input
                id="edit-phone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-status" className="text-xs text-muted-foreground">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="edit-status" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-observations" className="text-xs text-muted-foreground">
              Observações
            </Label>
            <Textarea
              id="edit-observations"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="mt-1 resize-none"
              rows={4}
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
