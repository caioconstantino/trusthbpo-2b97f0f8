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
    domain: "",
    multiCompany: "Não",
    status: "Ativo",
    responsible: "",
    plan: "",
    coupon: "",
    nextPayment: "",
    lastPayment: "",
    lastPaymentMethod: "",
    email: "",
    phone: "",
    observations: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.socialName || !formData.domain) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a Razão Social e o Domínio",
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
      domain: "",
      multiCompany: "Não",
      status: "Ativo",
      responsible: "",
      plan: "",
      coupon: "",
      nextPayment: "",
      lastPayment: "",
      lastPaymentMethod: "",
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
      
      <div className="space-y-4">
        {/* Linha 1: Documento, Razão Social, Domínio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <Label htmlFor="socialName">Razão Social *</Label>
            <Input
              id="socialName"
              value={formData.socialName}
              onChange={(e) => setFormData({ ...formData, socialName: e.target.value })}
              placeholder="Nome da empresa"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="domain">Domínio *</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase().replace(/\s/g, '') })}
              placeholder="suaempresa"
              className="mt-1"
              required
            />
          </div>
        </div>

        {/* Linha 2: Multiempresa, Status, Responsável, Plano */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="multiCompany">Multiempresa</Label>
            <Select value={formData.multiCompany} onValueChange={(value) => setFormData({ ...formData, multiCompany: value })}>
              <SelectTrigger id="multiCompany" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              placeholder="Revenda/Site"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="plan">Plano</Label>
            <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
              <SelectTrigger id="plan" className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha 3: Cupom, Próximo Pagamento, Último Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="coupon">Cupom</Label>
            <Input
              id="coupon"
              value={formData.coupon}
              onChange={(e) => setFormData({ ...formData, coupon: e.target.value })}
              placeholder="Código do cupom"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="nextPayment">Próximo Pagamento</Label>
            <Input
              id="nextPayment"
              type="date"
              value={formData.nextPayment}
              onChange={(e) => setFormData({ ...formData, nextPayment: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="lastPayment">Último Pagamento</Label>
            <Input
              id="lastPayment"
              type="date"
              value={formData.lastPayment}
              onChange={(e) => setFormData({ ...formData, lastPayment: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Linha 4: Forma de Pagamento */}
        <div>
          <Label htmlFor="lastPaymentMethod">Última Forma de Pagamento</Label>
          <Select value={formData.lastPaymentMethod} onValueChange={(value) => setFormData({ ...formData, lastPaymentMethod: value })}>
            <SelectTrigger id="lastPaymentMethod" className="mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Boleto">Boleto</SelectItem>
              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="Transferência">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Linha 5: Email, Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </form>
  );
};
