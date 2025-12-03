import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CNPJ_API_TOKEN = "jDdWal03g3DwdzWabVB0Qjk6ZmiOLbBUftxZMeSaKe1R";

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

const cleanDocument = (doc: string) => doc.replace(/\D/g, "");

export const CustomerForm = ({ onCustomerAdded }: { onCustomerAdded: () => void }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    document: "",
    socialName: "",
    status: "Ativo",
    email: "",
    phone: "",
    observations: ""
  });

  const searchCNPJ = async () => {
    const cleanedDoc = cleanDocument(formData.document);
    
    if (cleanedDoc.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://comercial.cnpj.ws/cnpj/${cleanedDoc}?token=${CNPJ_API_TOKEN}`
      );

      if (!response.ok) {
        throw new Error("CNPJ não encontrado");
      }

      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        socialName: data.razao_social || prev.socialName,
        phone: data.estabelecimento?.ddd1 && data.estabelecimento?.telefone1 
          ? `(${data.estabelecimento.ddd1}) ${data.estabelecimento.telefone1}`
          : prev.phone,
        email: data.estabelecimento?.email || prev.email
      }));

      toast({
        title: "CNPJ encontrado",
        description: `Razão Social: ${data.razao_social}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível consultar o CNPJ",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.socialName) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha a Razão Social",
        variant: "destructive"
      });
      return;
    }

    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) {
      toast({
        title: "Erro",
        description: "Domínio não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("tb_clientes")
        .insert({
          dominio,
          cpf_cnpj: formData.document,
          razao_social: formData.socialName,
          status: formData.status,
          email: formData.email,
          telefone: formData.phone,
          observacoes: formData.observations,
          responsavel: ""
        });

      if (error) throw error;

      toast({
        title: "Cliente cadastrado!",
        description: "O cliente foi adicionado com sucesso.",
      });

      setFormData({
        document: "",
        socialName: "",
        status: "Ativo",
        email: "",
        phone: "",
        observations: ""
      });

      onCustomerAdded();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Novo Cliente</h2>
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Linha 1: Documento, Razão Social */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="document">CPF/CNPJ</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={searchCNPJ}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="socialName">Razão Social / Nome *</Label>
            <Input
              id="socialName"
              value={formData.socialName}
              onChange={(e) => setFormData({ ...formData, socialName: e.target.value })}
              placeholder="Nome do cliente"
              className="mt-1"
              required
            />
          </div>
        </div>

        {/* Linha 2: Email, Telefone, Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
