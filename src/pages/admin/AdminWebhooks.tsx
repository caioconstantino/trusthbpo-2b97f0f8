import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Webhook, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Search, 
  Copy, 
  ExternalLink,
  LogOut,
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  DollarSign
} from "lucide-react";
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
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pagarme-webhook`;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin SaaS</h1>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-6 py-2">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto">
          <Button 
            variant="ghost" 
            className={isActive("/admin") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/clientes") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/clientes")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clientes
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/escolas") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/escolas")}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Escolas
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/alunos") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/alunos")}
          >
            <Users className="w-4 h-4 mr-2" />
            Alunos
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/webhooks") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
          >
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </Button>
          <Button 
            variant="ghost" 
            className={isActive("/admin/financeiro") ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}
            onClick={() => navigate("/admin/financeiro")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Webhooks</h2>
            <p className="text-slate-400">Visualize os webhooks recebidos do Pagar.me</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Webhook URL Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <ExternalLink className="h-5 w-5" />
              URL do Webhook
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure esta URL no painel do Pagar.me para receber os eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-700 p-3 rounded-lg text-sm break-all border border-slate-600 text-slate-300">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
                className="border-slate-600 hover:bg-slate-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por evento, provider ou conteúdo..."
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Webhooks List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Webhook className="h-5 w-5" />
              Webhooks Recebidos
            </CardTitle>
            <CardDescription className="text-slate-400">
              {filteredWebhooks?.length || 0} webhooks encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredWebhooks && filteredWebhooks.length > 0 ? (
              <div className="space-y-3">
                {filteredWebhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {webhook.provider}
                          </Badge>
                          <span className="font-medium text-white">
                            {webhook.event_type || "unknown"}
                          </span>
                          {webhook.processed ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Processado
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-500/20 text-slate-300">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-slate-400">
                          {format(new Date(webhook.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-700"
                          onClick={() => setSelectedWebhook(webhook)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] bg-slate-800 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-white">
                            <Webhook className="h-5 w-5" />
                            Detalhes do Webhook
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-slate-400">ID</label>
                              <p className="font-mono text-sm text-white">{webhook.id}</p>
                            </div>
                            <div>
                              <label className="text-sm text-slate-400">Provider</label>
                              <p className="text-white">{webhook.provider}</p>
                            </div>
                            <div>
                              <label className="text-sm text-slate-400">Evento</label>
                              <p className="text-white">{webhook.event_type || "N/A"}</p>
                            </div>
                            <div>
                              <label className="text-sm text-slate-400">Status</label>
                              <p className="text-white">{webhook.processed ? "Processado" : "Pendente"}</p>
                            </div>
                            <div>
                              <label className="text-sm text-slate-400">Recebido em</label>
                              <p className="text-white">{format(new Date(webhook.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                            </div>
                            {webhook.processed_at && (
                              <div>
                                <label className="text-sm text-slate-400">Processado em</label>
                                <p className="text-white">{format(new Date(webhook.processed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-slate-400">Payload</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-white"
                                onClick={() => copyToClipboard(JSON.stringify(webhook.payload, null, 2))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar
                              </Button>
                            </div>
                            <ScrollArea className="h-[300px] w-full rounded-md border border-slate-700 bg-slate-900">
                              <pre className="p-4 text-sm text-slate-300">
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
                <Webhook className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">Nenhum webhook recebido ainda</p>
                <p className="text-sm text-slate-500 mt-1">
                  Configure a URL acima no Pagar.me para começar a receber eventos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminWebhooks;
