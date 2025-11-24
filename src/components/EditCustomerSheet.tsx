import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface EditCustomerSheetProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCustomerSheet = ({ customerId, open, onOpenChange }: EditCustomerSheetProps) => {
  const customerData = {
    responsible: "Jorges Guedes",
    socialName: "Jorge Varejo",
    cpfCnpj: "12.345.678/0001-23",
    email: "jorgeguedes@gmail.com",
    phone: "1298817002",
    status: "Ativo",
    observations: "Sem observacoes."
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Cliente</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="edit-responsible" className="text-xs text-muted-foreground">
              Responsável
            </Label>
            <Input
              id="edit-responsible"
              defaultValue={customerData.responsible}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-social-name" className="text-xs text-muted-foreground">
              Razão Social
            </Label>
            <Input
              id="edit-social-name"
              defaultValue={customerData.socialName}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-cpf-cnpj" className="text-xs text-muted-foreground">
                CPF/CNPJ
              </Label>
              <Input
                id="edit-cpf-cnpj"
                defaultValue={customerData.cpfCnpj}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                defaultValue={customerData.email}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-phone" className="text-xs text-muted-foreground">
                Telefone
              </Label>
              <Input
                id="edit-phone"
                defaultValue={customerData.phone}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-status" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select defaultValue={customerData.status}>
                <SelectTrigger id="edit-status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-observations" className="text-xs text-muted-foreground">
              Observações
            </Label>
            <Textarea
              id="edit-observations"
              defaultValue={customerData.observations}
              className="mt-1 resize-none"
              rows={4}
            />
          </div>

          <Button className="w-full" size="lg">
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
