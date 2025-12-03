import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Webhook, RefreshCw, Eye, CheckCircle2, Clock, Search, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WebhookRecord {
  id: string;
  provider: string;
  event_type: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

const AdminWebhooks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRecord | null>(null);

  const { data: webhooks, isLoading, refetch } = useQuery({
    queryKey: ["admin-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tb_webhooks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WebhookRecord[];
    },
  });

  const filteredWebhooks = webhooks?.filter(
    (webhook) =>
      webhook.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webhook.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(webhook.payload).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pagarme-webhook`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">
              Visualize os webhooks recebidos do Pagar.me
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Webhook URL Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              URL do Webhook
            </CardTitle>
            <CardDescription>
              Configure esta URL no painel do Pagar.me para receber os eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background p-3 rounded-lg text-sm break-all border">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por evento, provider ou conteúdo..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks Recebidos
            </CardTitle>
            <CardDescription>
              {filteredWebhooks?.length || 0} webhooks encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWebhooks && filteredWebhooks.length > 0 ? (
              <div className="space-y-3">
                {filteredWebhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {webhook.provider}
                          </Badge>
                          <span className="font-medium">
                            {webhook.event_type || "unknown"}
                          </span>
                          {webhook.processed ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Processado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(webhook.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWebhook(webhook)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Webhook className="h-5 w-5" />
                            Detalhes do Webhook
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">ID</label>
                              <p className="font-mono text-sm">{webhook.id}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Provider</label>
                              <p>{webhook.provider}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Evento</label>
                              <p>{webhook.event_type || "N/A"}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Status</label>
                              <p>{webhook.processed ? "Processado" : "Pendente"}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Recebido em</label>
                              <p>{format(new Date(webhook.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                            </div>
                            {webhook.processed_at && (
                              <div>
                                <label className="text-sm text-muted-foreground">Processado em</label>
                                <p>{format(new Date(webhook.processed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-muted-foreground">Payload</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(webhook.payload, null, 2))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar
                              </Button>
                            </div>
                            <ScrollArea className="h-[300px] w-full rounded-md border">
                              <pre className="p-4 text-sm">
                                {JSON.stringify(webhook.payload, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Webhook className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhum webhook recebido ainda
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure a URL acima no Pagar.me para começar a receber eventos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminWebhooks;
