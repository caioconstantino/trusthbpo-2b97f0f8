import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, CheckCircle, AlertTriangle, Eye, Clock, Building2, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getUnidadeAtivaId } from "@/hooks/useUnidadeAtiva";

interface Sessao {
  id: string;
  dominio: string;
  unidade_id: number | null;
  usuario_id: string;
  usuario_nome: string;
  caixa_nome: string;
  valor_abertura: number;
  valor_fechamento: number | null;
  status: string;
  data_abertura: string;
  data_fechamento: string | null;
  observacoes: string | null;
  unidade_nome?: string;
}

interface SessionSummary {
  totalVendas: number;
  totalDinheiro: number;
  totalCredito: number;
  totalDebito: number;
  totalPix: number;
  valorAbertura: number;
  sangrias: number;
  quantidadeVendas: number;
}

export default function SessoesPdv() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("ativas");

  const dominio = localStorage.getItem("user_dominio") || "";
  const unidadeId = getUnidadeAtivaId();

  useEffect(() => {
    fetchSessoes();
  }, []);

  const fetchSessoes = async () => {
    try {
      let query = supabase
        .from("tb_sessoes_caixa")
        .select("*")
        .eq("dominio", dominio)
        .order("data_abertura", { ascending: false });

      if (unidadeId) {
        query = query.eq("unidade_id", unidadeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch unidades names
      const { data: unidades } = await supabase
        .from("tb_unidades")
        .select("id, nome")
        .eq("dominio", dominio);

      const unidadesMap = new Map(unidades?.map(u => [u.id, u.nome]));

      const sessoesWithUnidade = (data || []).map(s => ({
        ...s,
        unidade_nome: s.unidade_id ? unidadesMap.get(s.unidade_id) || "—" : "—"
      }));

      setSessoes(sessoesWithUnidade);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessao: Sessao) => {
    setSelectedSessao(sessao);
    setLoadingSummary(true);

    try {
      // Get sales for this session
      const { data: vendas } = await supabase
        .from("tb_vendas")
        .select("id, total")
        .eq("sessao_id", sessao.id);

      // Get sangrias for this session
      const { data: sangriasData } = await supabase
        .from("tb_sangrias")
        .select("valor")
        .eq("sessao_id", sessao.id);

      const totalSangrias = sangriasData?.reduce((sum, s) => sum + Number(s.valor), 0) || 0;

      // Get payments for these sales
      let totalDinheiro = 0;
      let totalCredito = 0;
      let totalDebito = 0;
      let totalPix = 0;

      if (vendas && vendas.length > 0) {
        const vendaIds = vendas.map(v => v.id);
        const { data: pagamentos } = await supabase
          .from("tb_vendas_pagamentos")
          .select("forma_pagamento, valor")
          .in("venda_id", vendaIds);

        if (pagamentos) {
          pagamentos.forEach(p => {
            switch (p.forma_pagamento) {
              case "Dinheiro":
                totalDinheiro += Number(p.valor);
                break;
              case "Crédito":
                totalCredito += Number(p.valor);
                break;
              case "Débito":
                totalDebito += Number(p.valor);
                break;
              case "Pix":
                totalPix += Number(p.valor);
                break;
            }
          });
        }
      }

      const totalVendas = vendas?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

      setSummary({
        totalVendas,
        totalDinheiro,
        totalCredito,
        totalDebito,
        totalPix,
        valorAbertura: sessao.valor_abertura,
        sangrias: totalSangrias,
        quantidadeVendas: vendas?.length || 0
      });
    } catch (error) {
      console.error("Error loading session details:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const sessoesAtivas = sessoes.filter(s => s.status === "aberto");
  const sessoesARevisar = sessoes.filter(s => {
    if (s.status !== "fechado" || !s.valor_fechamento) return false;
    const expectedCash = s.valor_abertura + (summary?.totalDinheiro || 0) - (summary?.sangrias || 0);
    return s.valor_fechamento !== expectedCash;
  });
  const sessoesFechadas = sessoes.filter(s => s.status === "fechado");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const SessaoCard = ({ sessao, showReviewBadge = false }: { sessao: Sessao; showReviewBadge?: boolean }) => {
    const expectedCash = sessao.valor_abertura;
    const difference = sessao.valor_fechamento ? sessao.valor_fechamento - expectedCash : 0;

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadSessionDetails(sessao)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{sessao.caixa_nome}</span>
                {sessao.status === "aberto" ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Ativo
                  </Badge>
                ) : showReviewBadge ? (
                  <Badge variant="destructive">A Revisar</Badge>
                ) : (
                  <Badge variant="secondary">Fechado</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {sessao.usuario_nome}
              </div>
              {sessao.unidade_nome && sessao.unidade_nome !== "—" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {sessao.unidade_nome}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(sessao.data_abertura)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Abertura</p>
              <p className="font-semibold">{formatCurrency(sessao.valor_abertura)}</p>
              {sessao.status === "fechado" && sessao.valor_fechamento !== null && (
                <>
                  <p className="text-sm text-muted-foreground mt-2">Fechamento</p>
                  <p className="font-semibold">{formatCurrency(sessao.valor_fechamento)}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sessões de PDV</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe as sessões de caixa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessoesAtivas.length}</p>
                <p className="text-sm text-muted-foreground">Sessões Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessoesARevisar.length}</p>
                <p className="text-sm text-muted-foreground">A Revisar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <Monitor className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessoesFechadas.length}</p>
                <p className="text-sm text-muted-foreground">Fechadas (Total)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ativas" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Ativas ({sessoesAtivas.length})
            </TabsTrigger>
            <TabsTrigger value="revisar" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              A Revisar ({sessoesARevisar.length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <Clock className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="mt-4">
            {sessoesAtivas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhuma sessão ativa</p>
                  <p className="text-muted-foreground">Não há caixas abertos no momento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessoesAtivas.map(sessao => (
                  <SessaoCard key={sessao.id} sessao={sessao} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="revisar" className="mt-4">
            {sessoesARevisar.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <p className="text-lg font-medium">Tudo em dia!</p>
                  <p className="text-muted-foreground">Não há sessões pendentes de revisão</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessoesARevisar.map(sessao => (
                  <SessaoCard key={sessao.id} sessao={sessao} showReviewBadge />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {sessoesFechadas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Sem histórico</p>
                  <p className="text-muted-foreground">Nenhuma sessão fechada encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessoesFechadas.slice(0, 20).map(sessao => (
                  <SessaoCard key={sessao.id} sessao={sessao} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSessao} onOpenChange={() => setSelectedSessao(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {selectedSessao?.caixa_nome}
            </DialogTitle>
            <DialogDescription>
              Detalhes da sessão de caixa
            </DialogDescription>
          </DialogHeader>

          {loadingSummary ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : summary && selectedSessao ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Operador</p>
                  <p className="font-medium">{selectedSessao.usuario_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedSessao.status === "aberto" ? "default" : "secondary"}>
                    {selectedSessao.status === "aberto" ? "Ativo" : "Fechado"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Abertura</p>
                  <p className="font-medium">{formatDate(selectedSessao.data_abertura)}</p>
                </div>
                {selectedSessao.data_fechamento && (
                  <div>
                    <p className="text-muted-foreground">Fechamento</p>
                    <p className="font-medium">{formatDate(selectedSessao.data_fechamento)}</p>
                  </div>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Valor de Abertura:</span>
                  <span className="font-medium">{formatCurrency(summary.valorAbertura)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="font-medium mb-1">Vendas ({summary.quantidadeVendas}):</div>
                  <div className="flex justify-between">
                    <span>Dinheiro:</span>
                    <span>{formatCurrency(summary.totalDinheiro)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crédito:</span>
                    <span>{formatCurrency(summary.totalCredito)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Débito:</span>
                    <span>{formatCurrency(summary.totalDebito)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pix:</span>
                    <span>{formatCurrency(summary.totalPix)}</span>
                  </div>
                </div>
                {summary.sangrias > 0 && (
                  <div className="border-t pt-2 flex justify-between text-orange-600 dark:text-orange-400">
                    <span>Sangrias:</span>
                    <span>- {formatCurrency(summary.sangrias)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total de Vendas:</span>
                  <span>{formatCurrency(summary.totalVendas)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-primary">
                  <span>Dinheiro Esperado:</span>
                  <span>{formatCurrency(summary.valorAbertura + summary.totalDinheiro - summary.sangrias)}</span>
                </div>
                {selectedSessao.valor_fechamento !== null && (
                  <>
                    <div className="flex justify-between font-medium">
                      <span>Valor Informado:</span>
                      <span>{formatCurrency(selectedSessao.valor_fechamento)}</span>
                    </div>
                    {(() => {
                      const expectedCash = summary.valorAbertura + summary.totalDinheiro - summary.sangrias;
                      const diff = selectedSessao.valor_fechamento - expectedCash;
                      return (
                        <div className={`p-2 rounded text-center font-medium ${
                          diff === 0 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                            : diff > 0 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {diff === 0 
                            ? "✓ Caixa confere!" 
                            : diff > 0 
                              ? `Sobra de ${formatCurrency(diff)}`
                              : `Falta de ${formatCurrency(Math.abs(diff))}`
                          }
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {selectedSessao.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedSessao.observacoes}</p>
                </div>
              )}

              <Button className="w-full" variant="outline" onClick={() => setSelectedSessao(null)}>
                Fechar
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}