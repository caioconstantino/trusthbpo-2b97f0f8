import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Building2, DollarSign, Users, Calendar, Receipt, TrendingUp, Clock, CreditCard, Wallet } from "lucide-react";
import { format, differenceInMonths } from "date-fns";

interface Cliente {
  id: number;
  dominio: string;
  razao_social: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  status: string;
  plano: string | null;
  responsavel: string | null;
  multiempresa: string | null;
  proximo_pagamento: string | null;
  ultimo_pagamento: string | null;
  ultima_forma_pagamento: string | null;
  cupom: string | null;
  created_at: string | null;
  tipo_conta: string | null;
  last_login_at: string | null;
  observacoes: string | null;
  pdvs_adicionais?: number;
  empresas_adicionais?: number;
  usuarios_adicionais?: number;
  produtos_adicionais?: number;
  agenda_ativa?: boolean;
}

interface Indicacao {
  id: string;
  indicado_nome: string;
  indicado_dominio: string;
  status: string;
  valor_comissao: number;
  created_at: string;
}

interface IndicacaoConfig {
  saldo: number;
  total_ganho: number;
  total_sacado: number;
  codigo: string;
  link_slug: string;
}

interface ViewClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
}

// Preços dos adicionais
const PRECOS = {
  basico: 39.90,
  profissional: 99.90,
  pdv_adicional: 10.00,
  empresa_adicional: 20.00,
  agenda: 29.90,
};

export function ViewClienteDialog({ open, onOpenChange, cliente }: ViewClienteDialogProps) {
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [indicacaoConfig, setIndicacaoConfig] = useState<IndicacaoConfig | null>(null);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalPago, setTotalPago] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && cliente) {
      fetchClienteData();
    }
  }, [open, cliente]);

  const parseDescontoFromObservacoes = (observacoes: string | null): number => {
    if (!observacoes) return 0;
    const match = observacoes.match(/Desconto\/Acréscimo:\s*([-\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  const calcularValorMensalidade = (cli: Cliente): number => {
    const plano = cli.plano?.toLowerCase() || "";
    let valorBase = 0;
    
    if (plano.includes("pro") || plano.includes("profissional") || plano.includes("99")) {
      valorBase = PRECOS.profissional;
    } else if (plano.includes("básico") || plano.includes("basico") || plano.includes("39")) {
      valorBase = PRECOS.basico;
    }

    // Adicionar PDVs adicionais
    const pdvsAdicionais = cli.pdvs_adicionais || 0;
    const empresasAdicionais = cli.empresas_adicionais || 0;
    const agendaAtiva = cli.agenda_ativa || false;

    let valorAdicionais = 0;
    valorAdicionais += pdvsAdicionais * PRECOS.pdv_adicional;
    valorAdicionais += empresasAdicionais * PRECOS.empresa_adicional;
    if (agendaAtiva) valorAdicionais += PRECOS.agenda;

    // Aplicar desconto/acréscimo
    const descontoAcrescimo = parseDescontoFromObservacoes(cli.observacoes);
    const valorComDesconto = valorBase * (1 + descontoAcrescimo / 100);

    return valorComDesconto + valorAdicionais;
  };

  const calcularMesesComoCliente = (createdAt: string | null): number => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const hoje = new Date();
    return differenceInMonths(hoje, created);
  };

  const fetchClienteData = async () => {
    if (!cliente) return;
    setIsLoading(true);

    try {
      // Buscar configuração de indicações
      const { data: configData } = await supabase
        .from("tb_indicacoes_config")
        .select("*")
        .eq("dominio", cliente.dominio)
        .maybeSingle();
      
      setIndicacaoConfig(configData);

      // Buscar indicações feitas por este cliente
      const { data: indicacoesData } = await supabase
        .from("tb_indicacoes")
        .select("*")
        .eq("indicador_dominio", cliente.dominio)
        .order("created_at", { ascending: false });
      
      setIndicacoes(indicacoesData || []);

      // Buscar total de vendas
      const { data: vendasData } = await supabase
        .from("tb_vendas")
        .select("total")
        .eq("dominio", cliente.dominio);
      
      const total = vendasData?.reduce((acc, v) => acc + Number(v.total), 0) || 0;
      setTotalVendas(total);

      // Calcular total pago (baseado nos meses como cliente x valor mensalidade)
      const meses = calcularMesesComoCliente(cliente.created_at);
      const valorMensal = calcularValorMensalidade(cliente);
      setTotalPago(meses * valorMensal);

    } catch (error) {
      console.error("Erro ao buscar dados do cliente:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Ativo: "bg-green-500/20 text-green-400",
      Inativo: "bg-red-500/20 text-red-400",
      Lead: "bg-blue-500/20 text-blue-400",
      Suspenso: "bg-amber-500/20 text-amber-400",
      Cancelado: "bg-red-500/20 text-red-400",
    };
    return styles[status] || "bg-slate-500/20 text-slate-400";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (!cliente) return null;

  const mesesComoCliente = calcularMesesComoCliente(cliente.created_at);
  const valorProximaFatura = calcularValorMensalidade(cliente);
  const descontoAcrescimo = parseDescontoFromObservacoes(cliente.observacoes);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {cliente.razao_social}
          </DialogTitle>
        </DialogHeader>

        {/* Insights Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg p-4 text-center border border-green-500/30">
            <Wallet className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Total Já Pago</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(totalPago)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-4 text-center border border-blue-500/30">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Tempo como Cliente</p>
            <p className="text-lg font-bold text-blue-400">{mesesComoCliente} {mesesComoCliente === 1 ? 'mês' : 'meses'}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg p-4 text-center border border-purple-500/30">
            <CreditCard className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Próxima Fatura</p>
            <p className="text-lg font-bold text-purple-400">{formatCurrency(valorProximaFatura)}</p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="bg-slate-700/50 border-slate-600">
            <TabsTrigger value="dados" className="data-[state=active]:bg-primary">Dados</TabsTrigger>
            <TabsTrigger value="indicacoes" className="data-[state=active]:bg-primary">Indicações</TabsTrigger>
            <TabsTrigger value="faturamento" className="data-[state=active]:bg-primary">Faturamento</TabsTrigger>
          </TabsList>

          {/* Dados Tab */}
          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Domínio</p>
                <p className="text-white font-medium">{cliente.dominio}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <Badge className={getStatusBadge(cliente.status)}>{cliente.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{cliente.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Telefone</p>
                <p className="text-white">{formatPhone(cliente.telefone)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">CPF/CNPJ</p>
                <p className="text-white">{cliente.cpf_cnpj || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Responsável</p>
                <p className="text-white">{cliente.responsavel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Plano</p>
                <p className="text-white">{cliente.plano || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Tipo de Conta</p>
                <p className="text-white capitalize">{cliente.tipo_conta || "padrão"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Multiempresa</p>
                <p className="text-white">{cliente.multiempresa || "Não"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Cupom</p>
                <p className="text-white">{cliente.cupom || "-"}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pagamentos
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Último Pagamento</p>
                  <p className="text-white">
                    {cliente.ultimo_pagamento 
                      ? format(new Date(cliente.ultimo_pagamento), "dd/MM/yyyy")
                      : "-"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Próximo Pagamento</p>
                  <p className="text-white">
                    {cliente.proximo_pagamento 
                      ? format(new Date(cliente.proximo_pagamento), "dd/MM/yyyy")
                      : "-"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Última Forma de Pagamento</p>
                  <p className="text-white">{cliente.ultima_forma_pagamento || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Último Login</p>
                  <p className="text-white">
                    {cliente.last_login_at 
                      ? format(new Date(cliente.last_login_at), "dd/MM/yyyy HH:mm")
                      : "-"
                    }
                  </p>
                </div>
              </div>
            </div>

            {cliente.observacoes && (
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400">Observações</p>
                <p className="text-white">{cliente.observacoes}</p>
              </div>
            )}
          </TabsContent>

          {/* Indicações Tab */}
          <TabsContent value="indicacoes" className="space-y-4 mt-4">
            {/* Saldo de Indicações */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Saldo Disponível</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(indicacaoConfig?.saldo || 0)}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Total Ganho</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(indicacaoConfig?.total_ganho || 0)}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Total Sacado</p>
                <p className="text-2xl font-bold text-amber-400">
                  {formatCurrency(indicacaoConfig?.total_sacado || 0)}
                </p>
              </div>
            </div>

            {indicacaoConfig && (
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-sm text-slate-400">Código de Indicação</p>
                <p className="text-white font-mono">{indicacaoConfig.codigo}</p>
              </div>
            )}

            {/* Lista de Indicações */}
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Indicações Realizadas ({indicacoes.length})
              </h4>
              {indicacoes.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Nenhuma indicação realizada</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {indicacoes.map((ind) => (
                    <div key={ind.id} className="bg-slate-700/30 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{ind.indicado_nome}</p>
                        <p className="text-slate-400 text-xs">{ind.indicado_dominio}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={ind.status === "convertido" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>
                          {ind.status}
                        </Badge>
                        <p className="text-green-400 text-sm mt-1">{formatCurrency(ind.valor_comissao)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Faturamento Tab */}
          <TabsContent value="faturamento" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Receipt className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-slate-400">Plano Atual</p>
                <p className="text-xl font-bold text-white">{cliente.plano || "Nenhum"}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Total de Vendas</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(totalVendas)}</p>
              </div>
            </div>

            {/* Detalhamento da Fatura */}
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Composição da Fatura Mensal
              </h4>
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Plano {cliente.plano || "Base"}</span>
                  <span className="text-white">
                    {formatCurrency(cliente.plano?.toLowerCase().includes("pro") || cliente.plano?.toLowerCase().includes("profissional") ? PRECOS.profissional : PRECOS.basico)}
                  </span>
                </div>
                {descontoAcrescimo !== 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">{descontoAcrescimo < 0 ? "Desconto" : "Acréscimo"} ({descontoAcrescimo}%)</span>
                    <span className={descontoAcrescimo < 0 ? "text-green-400" : "text-amber-400"}>
                      {descontoAcrescimo < 0 ? "-" : "+"}{formatCurrency(Math.abs((cliente.plano?.toLowerCase().includes("pro") || cliente.plano?.toLowerCase().includes("profissional") ? PRECOS.profissional : PRECOS.basico) * descontoAcrescimo / 100))}
                    </span>
                  </div>
                )}
                {(cliente.pdvs_adicionais || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">PDVs Adicionais ({cliente.pdvs_adicionais}x)</span>
                    <span className="text-white">+{formatCurrency((cliente.pdvs_adicionais || 0) * PRECOS.pdv_adicional)}</span>
                  </div>
                )}
                {(cliente.empresas_adicionais || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Empresas Adicionais ({cliente.empresas_adicionais}x)</span>
                    <span className="text-white">+{formatCurrency((cliente.empresas_adicionais || 0) * PRECOS.empresa_adicional)}</span>
                  </div>
                )}
                {cliente.agenda_ativa && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Módulo Agenda</span>
                    <span className="text-white">+{formatCurrency(PRECOS.agenda)}</span>
                  </div>
                )}
                <div className="border-t border-slate-600 pt-3 flex justify-between items-center font-semibold">
                  <span className="text-white">Total Mensal</span>
                  <span className="text-primary text-lg">{formatCurrency(valorProximaFatura)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Histórico de Assinatura
              </h4>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white">{cliente.plano || "Sem plano"}</p>
                    <p className="text-slate-400 text-sm">
                      Desde {cliente.created_at ? format(new Date(cliente.created_at), "dd/MM/yyyy") : "-"}
                    </p>
                  </div>
                  <Badge className={getStatusBadge(cliente.status)}>{cliente.status}</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}