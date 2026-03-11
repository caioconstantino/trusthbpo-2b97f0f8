import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Loader2,
  Trash2,
  Copy,
  ShoppingCart,
  Package,
  Webhook,
  Eye,
  Check,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Plug,
} from "lucide-react";

interface Integracao {
  id: string;
  dominio: string;
  unidade_id: number | null;
  nome: string;
  tipo: string;
  descricao: string | null;
  webhook_token: string;
  ativo: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
}

interface IntegracaoLog {
  id: string;
  integracao_id: string;
  status: string;
  payload: unknown;
  resposta: string | null;
  created_at: string;
}

const TIPOS_INTEGRACAO = [
  { value: "receber_vendas", label: "Receber Vendas", icon: ShoppingCart, desc: "Receba vendas de outros sistemas automaticamente" },
  { value: "receber_produtos", label: "Receber Produtos", icon: Package, desc: "Importe produtos de sistemas externos" },
  { value: "webhook_personalizado", label: "Webhook Genérico", icon: Webhook, desc: "Receba qualquer dado via webhook" },
];

const INTEGRACOES_PRONTAS = [
  {
    id: "ecommerce",
    nome: "E-commerce",
    descricao: "Receba vendas do seu e-commerce automaticamente",
    icon: ShoppingCart,
    tipo: "receber_vendas",
    em_breve: false,
  },
  {
    id: "erp",
    nome: "ERP / Estoque",
    descricao: "Sincronize produtos com seu sistema de gestão",
    icon: Package,
    tipo: "receber_produtos",
    em_breve: false,
  },
  {
    id: "whatsapp",
    nome: "WhatsApp",
    descricao: "Notificações e atendimento via WhatsApp",
    icon: MessageSquare,
    tipo: "webhook_personalizado",
    em_breve: true,
  },
  {
    id: "analytics",
    nome: "Analytics",
    descricao: "Envie dados para plataformas de análise",
    icon: BarChart3,
    tipo: "webhook_personalizado",
    em_breve: true,
  },
];

interface Props {
  dominio: string;
  unidadeId?: number | null;
}

export function IntegrationHubTab({ dominio, unidadeId }: Props) {
  const { toast } = useToast();
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New integration dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("receber_vendas");
  const [descricao, setDescricao] = useState("");
  const [selectedSessaoId, setSelectedSessaoId] = useState("");
  const [sessoes, setSessoes] = useState<{ id: string; caixa_nome: string; usuario_nome: string; status: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Logs dialog
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedIntegracao, setSelectedIntegracao] = useState<Integracao | null>(null);
  const [logs, setLogs] = useState<IntegracaoLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Created integration dialog (shows token/endpoint)
  const [createdDialogOpen, setCreatedDialogOpen] = useState(false);
  const [createdIntegracao, setCreatedIntegracao] = useState<Integracao | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "dymdchhxabwaxownoxtz";
  const webhookEndpoint = `https://${projectId}.supabase.co/functions/v1/integration-webhook`;

  useEffect(() => {
    fetchIntegracoes();
    fetchSessoes();
  }, [dominio]);

  const fetchSessoes = async () => {
    try {
      const { data } = await supabase
        .from("tb_sessoes_caixa")
        .select("id, caixa_nome, usuario_nome, status")
        .eq("dominio", dominio)
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false });
      setSessoes(data || []);
    } catch (e) {
      console.error("Erro ao carregar sessões:", e);
    }
  };

  const fetchIntegracoes = async () => {
    try {
      const { data, error } = await supabase
        .from("tb_integracoes")
        .select("*")
        .eq("dominio", dominio)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIntegracoes((data || []) as unknown as Integracao[]);
    } catch (error) {
      console.error("Erro ao carregar integrações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createIntegracao = async (presetNome?: string, presetTipo?: string) => {
    const finalNome = presetNome || nome;
    const finalTipo = presetTipo || tipo;

    if (!finalNome.trim()) return;

    setIsSaving(true);
    try {
      const config: Record<string, unknown> = {};
      if (finalTipo === "receber_vendas" && selectedSessaoId && selectedSessaoId !== "nenhum") {
        config.sessao_id = selectedSessaoId;
      }

      const { data, error } = await supabase
        .from("tb_integracoes")
        .insert({
          dominio,
          unidade_id: unidadeId || null,
          nome: finalNome,
          tipo: finalTipo,
          descricao: descricao || null,
          config: config as any,
        })
        .select()
        .single();

      if (error) throw error;

      const created = data as unknown as Integracao;
      setCreatedIntegracao(created);
      setDialogOpen(false);
      setCreatedDialogOpen(true);
      setNome("");
      setDescricao("");
      setSelectedSessaoId("");
      fetchIntegracoes();

      toast({ title: "Integração criada!", description: "Token e endpoint gerados com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAtivo = async (integracao: Integracao) => {
    try {
      const { error } = await supabase
        .from("tb_integracoes")
        .update({ ativo: !integracao.ativo })
        .eq("id", integracao.id);

      if (error) throw error;
      fetchIntegracoes();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const deleteIntegracao = async (integracao: Integracao) => {
    if (!confirm(`Deseja excluir a integração "${integracao.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from("tb_integracoes")
        .delete()
        .eq("id", integracao.id);

      if (error) throw error;
      toast({ title: "Integração excluída" });
      fetchIntegracoes();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const openLogs = async (integracao: Integracao) => {
    setSelectedIntegracao(integracao);
    setLogsDialogOpen(true);
    setIsLoadingLogs(true);

    try {
      const { data, error } = await supabase
        .from("tb_integracoes_logs")
        .select("*")
        .eq("integracao_id", integracao.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as unknown as IntegracaoLog[]);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const copyToClipboard = async (text: string, field: "token" | "endpoint") => {
    await navigator.clipboard.writeText(text);
    if (field === "token") {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
  };

  const tipoLabel = (tipo: string) => {
    return TIPOS_INTEGRACAO.find((t) => t.value === tipo)?.label || tipo;
  };

  const handleConnectPreset = (preset: (typeof INTEGRACOES_PRONTAS)[0]) => {
    if (preset.em_breve) {
      toast({ title: "Em breve!", description: `A integração com ${preset.nome} estará disponível em breve.` });
      return;
    }
    setNome(`${preset.nome}`);
    setTipo(preset.tipo);
    setDescricao(preset.descricao);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção 1: Integrações Prontas */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Integrações Prontas</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Conecte rapidamente com plataformas populares
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INTEGRACOES_PRONTAS.map((preset) => {
            const Icon = preset.icon;
            return (
              <Card
                key={preset.id}
                className={`relative transition-all hover:shadow-md ${preset.em_breve ? "opacity-60" : "cursor-pointer hover:border-primary/50"}`}
              >
                {preset.em_breve && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                    Em breve
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{preset.nome}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{preset.descricao}</p>
                  <Button
                    size="sm"
                    variant={preset.em_breve ? "outline" : "default"}
                    className="w-full"
                    onClick={() => handleConnectPreset(preset)}
                    disabled={preset.em_breve}
                  >
                    <Plug className="h-4 w-4 mr-1" />
                    {preset.em_breve ? "Indisponível" : "Conectar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Seção 2: Minhas Integrações */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Minhas Integrações</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie seus webhooks e integrações customizadas
            </p>
          </div>
          <Button onClick={() => { setNome(""); setDescricao(""); setTipo("receber_vendas"); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Integração
          </Button>
        </div>

        {integracoes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhuma integração configurada</p>
              <p className="text-sm text-muted-foreground/70">Crie uma integração para receber dados de outros sistemas</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integracoes.map((integracao) => (
                  <TableRow key={integracao.id}>
                    <TableCell className="font-medium">{integracao.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tipoLabel(integracao.tipo)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[120px] truncate">
                          {integracao.webhook_token.substring(0, 12)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(integracao.webhook_token, "token")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={integracao.ativo}
                        onCheckedChange={() => toggleAtivo(integracao)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openLogs(integracao)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteIntegracao(integracao)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Dialog: Nova Integração */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Integração</DialogTitle>
            <DialogDescription>
              Configure uma nova integração para receber dados externos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Meu E-commerce" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INTEGRACAO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TIPOS_INTEGRACAO.find((t) => t.value === tipo)?.desc}
              </p>
            </div>
            {tipo === "receber_vendas" && (
              <div className="space-y-2">
                <Label>PDV / Caixa (opcional)</Label>
                <Select value={selectedSessaoId} onValueChange={setSelectedSessaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caixa aberto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum (informar no payload)</SelectItem>
                    {sessoes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.caixa_nome} - {s.usuario_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vincule as vendas recebidas a um caixa aberto. Se não selecionar, o sistema externo deverá enviar o sessao_id no payload.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a integração" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createIntegracao()} disabled={isSaving || !nome.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Criar Integração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Integração Criada (Token + Endpoint) */}
      <Dialog open={createdDialogOpen} onOpenChange={setCreatedDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Integração Criada!
            </DialogTitle>
            <DialogDescription>
              Use os dados abaixo para configurar a integração no sistema externo
            </DialogDescription>
          </DialogHeader>
          {createdIntegracao && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Endpoint (URL)</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-3 rounded-md break-all">{webhookEndpoint}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookEndpoint, "endpoint")}>
                    {copiedEndpoint ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Token (Header: X-Integration-Token)</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-3 rounded-md break-all">{createdIntegracao.webhook_token}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdIntegracao.webhook_token, "token")}>
                    {copiedToken ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Como usar:</p>
                <p className="text-xs text-muted-foreground">
                  Envie um <code className="bg-muted px-1 rounded">POST</code> para o endpoint acima com o header{" "}
                  <code className="bg-muted px-1 rounded">X-Integration-Token: {createdIntegracao.webhook_token.substring(0, 8)}...</code>
                </p>
                {createdIntegracao.tipo === "receber_vendas" && (
                  <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
{`{
  "cliente_nome": "João Silva",
  "sessao_id": "uuid-da-sessao-do-caixa (opcional)",
  "desconto_percentual": 0,
  "acrescimo_percentual": 0,
  "itens": [
    { "nome": "Produto A", "quantidade": 2, "preco_unitario": 49.90, "produto_id": 1 }
  ],
  "pagamentos": [
    { "forma_pagamento": "Pix", "valor": 99.80 }
  ]
}`}
                  </pre>
                )}
                {createdIntegracao.tipo === "receber_produtos" && (
                  <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
{`{
  "produtos": [
    { "nome": "Produto A", "preco_venda": 99.90, "preco_custo": 50.00 }
  ]
}`}
                  </pre>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Logs */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs - {selectedIntegracao?.nome}</DialogTitle>
            <DialogDescription>Últimas 50 chamadas recebidas</DialogDescription>
          </DialogHeader>
          {isLoadingLogs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum log registrado ainda</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={log.status === "sucesso" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {log.resposta && (
                    <p className="text-sm text-muted-foreground mb-2">{log.resposta}</p>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver payload
                    </summary>
                    <pre className="mt-2 bg-muted p-2 rounded-md overflow-x-auto max-h-40">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
