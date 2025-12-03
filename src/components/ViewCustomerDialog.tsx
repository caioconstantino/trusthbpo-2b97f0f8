import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { MessageCircle, Phone, Building2, ChevronDown, ChevronUp, MapPin, Users, Briefcase } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface Customer {
  id: number;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  status: string;
  observacoes: string;
  detalhes_cnpj?: string | null;
}

interface ViewCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewCustomerDialog = ({ customer, open, onOpenChange }: ViewCustomerDialogProps) => {
  const [cnpjDetailsOpen, setCnpjDetailsOpen] = useState(false);

  if (!customer) return null;

  const openWhatsApp = () => {
    const phone = customer.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  const openPhone = () => {
    window.open(`tel:${customer.telefone}`, "_self");
  };

  const cnpjData = customer.detalhes_cnpj ? JSON.parse(customer.detalhes_cnpj) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Lead":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
              {customer.status}
            </span>
          </div>

          {/* Dados do Cliente */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg mb-3">Dados do Cliente</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-muted-foreground">Razão Social:</span>{" "}
                {customer.razao_social}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">CPF/CNPJ:</span>{" "}
                {customer.cpf_cnpj || "Não informado"}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Email:</span>{" "}
                {customer.email || "Não informado"}
              </p>
              {customer.telefone && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Telefone:</span>
                  <span>{customer.telefone}</span>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white"
                      onClick={openWhatsApp}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-7 w-7 bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={openPhone}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {customer.observacoes && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-lg mb-3">Observações:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.observacoes}</p>
            </div>
          )}

          {/* Dados do CNPJ */}
          {cnpjData && (
            <Collapsible open={cnpjDetailsOpen} onOpenChange={setCnpjDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Ver Dados Completos do CNPJ
                  </span>
                  {cnpjDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                {/* Informações Gerais */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Informações Gerais
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Razão Social:</span> {cnpjData.razao_social}</p>
                    <p><span className="text-muted-foreground">CNPJ Raiz:</span> {cnpjData.cnpj_raiz}</p>
                    {cnpjData.capital_social && (
                      <p><span className="text-muted-foreground">Capital Social:</span> R$ {parseFloat(cnpjData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    )}
                    {cnpjData.porte?.descricao && (
                      <p><span className="text-muted-foreground">Porte:</span> {cnpjData.porte.descricao}</p>
                    )}
                    {cnpjData.natureza_juridica?.descricao && (
                      <p><span className="text-muted-foreground">Natureza Jurídica:</span> {cnpjData.natureza_juridica.descricao}</p>
                    )}
                    {cnpjData.simples && (
                      <>
                        <p><span className="text-muted-foreground">Simples Nacional:</span> {cnpjData.simples.simples}</p>
                        <p><span className="text-muted-foreground">MEI:</span> {cnpjData.simples.mei}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Estabelecimento */}
                {cnpjData.estabelecimento && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço e Contato
                    </h4>
                    <div className="space-y-2 text-sm">
                      {cnpjData.estabelecimento.nome_fantasia && (
                        <p><span className="text-muted-foreground">Nome Fantasia:</span> {cnpjData.estabelecimento.nome_fantasia}</p>
                      )}
                      <p><span className="text-muted-foreground">Situação:</span> {cnpjData.estabelecimento.situacao_cadastral}</p>
                      <p>
                        <span className="text-muted-foreground">Endereço:</span>{" "}
                        {cnpjData.estabelecimento.tipo_logradouro} {cnpjData.estabelecimento.logradouro}, {cnpjData.estabelecimento.numero}
                        {cnpjData.estabelecimento.complemento && ` - ${cnpjData.estabelecimento.complemento}`}
                      </p>
                      <p><span className="text-muted-foreground">Bairro:</span> {cnpjData.estabelecimento.bairro}</p>
                      <p>
                        <span className="text-muted-foreground">Cidade/UF:</span>{" "}
                        {cnpjData.estabelecimento.cidade?.nome} - {cnpjData.estabelecimento.estado?.sigla}
                      </p>
                      <p><span className="text-muted-foreground">CEP:</span> {cnpjData.estabelecimento.cep}</p>
                      {cnpjData.estabelecimento.email && (
                        <p><span className="text-muted-foreground">Email:</span> {cnpjData.estabelecimento.email}</p>
                      )}
                      {cnpjData.estabelecimento.atividade_principal && (
                        <p><span className="text-muted-foreground">Atividade Principal:</span> {cnpjData.estabelecimento.atividade_principal.descricao}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sócios */}
                {cnpjData.socios && cnpjData.socios.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Sócios ({cnpjData.socios.length})
                    </h4>
                    <div className="space-y-3">
                      {cnpjData.socios.map((socio: any, index: number) => (
                        <div key={index} className="text-sm border-l-2 border-primary/30 pl-3">
                          <p className="font-medium">{socio.nome}</p>
                          <p className="text-muted-foreground text-xs">
                            {socio.qualificacao_socio?.descricao} • Entrada: {new Date(socio.data_entrada).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
