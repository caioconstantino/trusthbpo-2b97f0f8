import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CustomerForm = ({ onCustomerAdded }: { onCustomerAdded: () => void }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    document: "",
    socialName: "",
    status: "Ativo",
    responsible: "",
    email: "",
    phone: "",
    observations: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.socialName) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a Razão Social",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Cliente cadastrado!",
      description: "O cliente foi adicionado com sucesso.",
    });

    setFormData({
      document: "",
      socialName: "",
      status: "Ativo",
      responsible: "",
      email: "",
      phone: "",
      observations: ""
    });

    onCustomerAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Novo Cliente</h2>
        <Button type="submit" size="lg">
          Cadastrar
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Documento */}
        <div>
          <Label htmlFor="document">Documento</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="document"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              placeholder="CPF/CNPJ"
            />
            <Button type="button" variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Razão Social */}
        <div>
          <Label htmlFor="socialName">Razão Social</Label>
          <Input
            id="socialName"
            value={formData.socialName}
            onChange={(e) => setFormData({ ...formData, socialName: e.target.value })}
            placeholder="Razão Social"
            className="mt-1"
            required
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger id="status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Responsável */}
        <div>
          <Label htmlFor="responsible">Responsável</Label>
          <Input
            id="responsible"
            value={formData.responsible}
            onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
            placeholder="Nome do responsável"
            className="mt-1"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            className="mt-1"
          />
        </div>

        {/* Telefone */}
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="mt-1"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          placeholder="Observações sobre o cliente"
          className="mt-1 resize-none"
          rows={3}
        />
      </div>
    </form>
  );
};
