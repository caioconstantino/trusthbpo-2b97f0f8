import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "./useUnidadeAtiva";
import { toast } from "@/hooks/use-toast";

export interface KanbanColuna {
  id: string;
  dominio: string;
  unidade_id: number | null;
  nome: string;
  cor: string;
  ordem: number;
  status_proposta: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropostaAutomacao {
  id: string;
  dominio: string;
  unidade_id: number | null;
  nome: string;
  ativo: boolean;
  coluna_origem_id: string | null;
  coluna_destino_id: string | null;
  tipo_acao: "email_cliente" | "lembrete" | "notificacao" | "webhook";
  config: AutomacaoConfig;
  created_at: string;
  updated_at: string;
  coluna_origem?: KanbanColuna;
  coluna_destino?: KanbanColuna;
}

export interface AutomacaoConfig {
  // Email config
  assunto?: string;
  mensagem?: string;
  
  // Lembrete config
  dias_lembrete?: number;
  titulo_lembrete?: string;
  
  // Notificação config
  titulo_notificacao?: string;
  mensagem_notificacao?: string;
  
  // Webhook config
  webhook_url?: string;
  webhook_method?: "POST" | "GET";
  webhook_headers?: Record<string, string>;
}

export interface PropostaLembrete {
  id: string;
  proposta_id: string;
  dominio: string;
  unidade_id: number | null;
  titulo: string;
  descricao: string | null;
  data_lembrete: string;
  concluido: boolean;
  automacao_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropostaNotificacao {
  id: string;
  proposta_id: string;
  dominio: string;
  unidade_id: number | null;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  automacao_id: string | null;
  created_at: string;
}

const DEFAULT_COLUMNS: Partial<KanbanColuna>[] = [
  { nome: "Rascunho", cor: "#6b7280", ordem: 0, status_proposta: "rascunho" },
  { nome: "Enviada", cor: "#3b82f6", ordem: 1, status_proposta: "enviada" },
  { nome: "Visualizada", cor: "#8b5cf6", ordem: 2, status_proposta: "visualizada" },
  { nome: "Aprovada", cor: "#22c55e", ordem: 3, status_proposta: "aprovada" },
  { nome: "Rejeitada", cor: "#ef4444", ordem: 4, status_proposta: "rejeitada" },
  { nome: "Convertida", cor: "#f59e0b", ordem: 5, status_proposta: "convertida" },
];

export const usePropostasKanban = () => {
  const [colunas, setColunas] = useState<KanbanColuna[]>([]);
  const [automacoes, setAutomacoes] = useState<PropostaAutomacao[]>([]);
  const [lembretes, setLembretes] = useState<PropostaLembrete[]>([]);
  const [notificacoes, setNotificacoes] = useState<PropostaNotificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { unidadeAtiva } = useUnidadeAtiva();

  const dominio = localStorage.getItem("user_dominio") || "";

  const fetchColunas = async () => {
    if (!dominio) return;

    try {
      let query = supabase
        .from("tb_propostas_kanban_colunas")
        .select("*")
        .eq("dominio", dominio)
        .order("ordem");

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Se não houver colunas, criar as padrão
      if (!data || data.length === 0) {
        await createDefaultColumns();
        return;
      }

      setColunas(data);
    } catch (error) {
      console.error("Erro ao buscar colunas:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultColumns = async () => {
    try {
      const columnsToInsert = DEFAULT_COLUMNS.map((col, index) => ({
        dominio,
        unidade_id: unidadeAtiva?.id || null,
        nome: col.nome!,
        cor: col.cor!,
        ordem: index,
        status_proposta: col.status_proposta || null,
      }));

      const { data, error } = await supabase
        .from("tb_propostas_kanban_colunas")
        .insert(columnsToInsert)
        .select();

      if (error) throw error;

      setColunas(data || []);
    } catch (error) {
      console.error("Erro ao criar colunas padrão:", error);
    }
  };

  const fetchAutomacoes = async () => {
    if (!dominio) return;

    try {
      let query = supabase
        .from("tb_propostas_automacoes")
        .select(`
          *,
          coluna_origem:tb_propostas_kanban_colunas!coluna_origem_id(*),
          coluna_destino:tb_propostas_kanban_colunas!coluna_destino_id(*)
        `)
        .eq("dominio", dominio)
        .order("created_at", { ascending: false });

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const parsedData = (data || []).map((a: any) => ({
        ...a,
        config: typeof a.config === "string" ? JSON.parse(a.config) : a.config || {},
      }));

      setAutomacoes(parsedData);
    } catch (error) {
      console.error("Erro ao buscar automações:", error);
    }
  };

  const fetchLembretes = async () => {
    if (!dominio) return;

    try {
      let query = supabase
        .from("tb_propostas_lembretes")
        .select("*")
        .eq("dominio", dominio)
        .eq("concluido", false)
        .order("data_lembrete");

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLembretes(data || []);
    } catch (error) {
      console.error("Erro ao buscar lembretes:", error);
    }
  };

  const fetchNotificacoes = async () => {
    if (!dominio) return;

    try {
      let query = supabase
        .from("tb_propostas_notificacoes")
        .select("*")
        .eq("dominio", dominio)
        .eq("lida", false)
        .order("created_at", { ascending: false });

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  };

  // CRUD Colunas
  const createColuna = async (data: Partial<KanbanColuna>) => {
    try {
      const maxOrdem = colunas.length > 0 ? Math.max(...colunas.map(c => c.ordem)) + 1 : 0;

      const { data: newColuna, error } = await supabase
        .from("tb_propostas_kanban_colunas")
        .insert({
          dominio,
          unidade_id: unidadeAtiva?.id || null,
          nome: data.nome || "Nova Coluna",
          cor: data.cor || "#6b7280",
          ordem: maxOrdem,
          status_proposta: data.status_proposta || null,
        })
        .select()
        .single();

      if (error) throw error;

      setColunas(prev => [...prev, newColuna]);
      toast({ title: "Sucesso", description: "Coluna criada com sucesso" });
      return newColuna;
    } catch (error) {
      console.error("Erro ao criar coluna:", error);
      toast({ title: "Erro", description: "Não foi possível criar a coluna", variant: "destructive" });
      throw error;
    }
  };

  const updateColuna = async (id: string, data: Partial<KanbanColuna>) => {
    try {
      const { error } = await supabase
        .from("tb_propostas_kanban_colunas")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      setColunas(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      toast({ title: "Sucesso", description: "Coluna atualizada" });
    } catch (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a coluna", variant: "destructive" });
      throw error;
    }
  };

  const deleteColuna = async (id: string, moveToColumnId?: string) => {
    try {
      // Se tiver uma coluna destino, mover as propostas primeiro
      if (moveToColumnId) {
        await supabase
          .from("tb_propostas")
          .update({ coluna_id: moveToColumnId })
          .eq("coluna_id", id);
      }

      const { error } = await supabase
        .from("tb_propostas_kanban_colunas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setColunas(prev => prev.filter(c => c.id !== id));
      toast({ title: "Sucesso", description: "Coluna removida" });
    } catch (error) {
      console.error("Erro ao excluir coluna:", error);
      toast({ title: "Erro", description: "Não foi possível excluir a coluna", variant: "destructive" });
      throw error;
    }
  };

  const reorderColunas = async (newOrder: KanbanColuna[]) => {
    try {
      const updates = newOrder.map((col, index) => ({
        id: col.id,
        ordem: index,
      }));

      for (const update of updates) {
        await supabase
          .from("tb_propostas_kanban_colunas")
          .update({ ordem: update.ordem })
          .eq("id", update.id);
      }

      setColunas(newOrder.map((col, index) => ({ ...col, ordem: index })));
    } catch (error) {
      console.error("Erro ao reordenar colunas:", error);
    }
  };

  // CRUD Automações
  const createAutomacao = async (data: Partial<PropostaAutomacao>) => {
    try {
      const { data: newAutomacao, error } = await supabase
        .from("tb_propostas_automacoes")
        .insert({
          dominio,
          unidade_id: unidadeAtiva?.id || null,
          nome: data.nome || "Nova Automação",
          ativo: data.ativo ?? true,
          coluna_origem_id: data.coluna_origem_id || null,
          coluna_destino_id: data.coluna_destino_id || null,
          tipo_acao: data.tipo_acao || "notificacao",
          config: JSON.stringify(data.config || {}),
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAutomacoes();
      toast({ title: "Sucesso", description: "Automação criada com sucesso" });
      return newAutomacao;
    } catch (error) {
      console.error("Erro ao criar automação:", error);
      toast({ title: "Erro", description: "Não foi possível criar a automação", variant: "destructive" });
      throw error;
    }
  };

  const updateAutomacao = async (id: string, data: Partial<PropostaAutomacao>) => {
    try {
      const updateData = {
        ...data,
        config: data.config ? JSON.stringify(data.config) : undefined,
      };

      const { error } = await supabase
        .from("tb_propostas_automacoes")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchAutomacoes();
      toast({ title: "Sucesso", description: "Automação atualizada" });
    } catch (error) {
      console.error("Erro ao atualizar automação:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a automação", variant: "destructive" });
      throw error;
    }
  };

  const deleteAutomacao = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_propostas_automacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAutomacoes(prev => prev.filter(a => a.id !== id));
      toast({ title: "Sucesso", description: "Automação excluída" });
    } catch (error) {
      console.error("Erro ao excluir automação:", error);
      toast({ title: "Erro", description: "Não foi possível excluir a automação", variant: "destructive" });
      throw error;
    }
  };

  // Executar automações quando proposta muda de coluna
  const executeAutomacoes = async (
    propostaId: string,
    propostaTitulo: string,
    clienteEmail: string | null,
    clienteNome: string | null,
    colunaOrigemId: string | null,
    colunaDestinoId: string
  ) => {
    const matchingAutomacoes = automacoes.filter(
      a => a.ativo && 
           a.coluna_destino_id === colunaDestinoId &&
           (!a.coluna_origem_id || a.coluna_origem_id === colunaOrigemId)
    );

    for (const automacao of matchingAutomacoes) {
      try {
        switch (automacao.tipo_acao) {
          case "notificacao":
            await supabase.from("tb_propostas_notificacoes").insert({
              proposta_id: propostaId,
              dominio,
              unidade_id: unidadeAtiva?.id || null,
              titulo: automacao.config.titulo_notificacao || `Proposta movida: ${propostaTitulo}`,
              mensagem: automacao.config.mensagem_notificacao || `A proposta foi movida para ${colunas.find(c => c.id === colunaDestinoId)?.nome}`,
              automacao_id: automacao.id,
            });
            break;

          case "lembrete":
            const diasLembrete = automacao.config.dias_lembrete || 3;
            const dataLembrete = new Date();
            dataLembrete.setDate(dataLembrete.getDate() + diasLembrete);

            await supabase.from("tb_propostas_lembretes").insert({
              proposta_id: propostaId,
              dominio,
              unidade_id: unidadeAtiva?.id || null,
              titulo: automacao.config.titulo_lembrete || `Follow-up: ${propostaTitulo}`,
              descricao: `Lembrete automático para a proposta ${propostaTitulo}`,
              data_lembrete: dataLembrete.toISOString(),
              automacao_id: automacao.id,
            });
            break;

          case "webhook":
            if (automacao.config.webhook_url) {
              try {
                await fetch(automacao.config.webhook_url, {
                  method: automacao.config.webhook_method || "POST",
                  mode: "no-cors",
                  headers: {
                    "Content-Type": "application/json",
                    ...(automacao.config.webhook_headers || {}),
                  },
                  body: JSON.stringify({
                    proposta_id: propostaId,
                    proposta_titulo: propostaTitulo,
                    cliente_nome: clienteNome,
                    cliente_email: clienteEmail,
                    coluna_origem: colunas.find(c => c.id === colunaOrigemId)?.nome,
                    coluna_destino: colunas.find(c => c.id === colunaDestinoId)?.nome,
                    timestamp: new Date().toISOString(),
                  }),
                });
              } catch (webhookError) {
                console.error("Erro no webhook:", webhookError);
              }
            }
            break;

          case "email_cliente":
            // Email seria enviado via edge function
            console.log("Email automático para:", clienteEmail);
            break;
        }
      } catch (error) {
        console.error("Erro ao executar automação:", automacao.nome, error);
      }
    }

    // Refresh notificações e lembretes
    await Promise.all([fetchNotificacoes(), fetchLembretes()]);
  };

  // Marcar notificação como lida
  const markNotificacaoAsRead = async (id: string) => {
    try {
      await supabase
        .from("tb_propostas_notificacoes")
        .update({ lida: true })
        .eq("id", id);

      setNotificacoes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Erro ao marcar notificação:", error);
    }
  };

  // Marcar lembrete como concluído
  const markLembreteAsDone = async (id: string) => {
    try {
      await supabase
        .from("tb_propostas_lembretes")
        .update({ concluido: true })
        .eq("id", id);

      setLembretes(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Erro ao marcar lembrete:", error);
    }
  };

  useEffect(() => {
    if (dominio) {
      fetchColunas();
      fetchAutomacoes();
      fetchLembretes();
      fetchNotificacoes();
    }
  }, [dominio, unidadeAtiva]);

  return {
    colunas,
    automacoes,
    lembretes,
    notificacoes,
    loading,
    fetchColunas,
    fetchAutomacoes,
    fetchLembretes,
    fetchNotificacoes,
    createColuna,
    updateColuna,
    deleteColuna,
    reorderColunas,
    createAutomacao,
    updateAutomacao,
    deleteAutomacao,
    executeAutomacoes,
    markNotificacaoAsRead,
    markLembreteAsDone,
  };
};
