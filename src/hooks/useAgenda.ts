import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUnidadeAtiva } from "@/hooks/useUnidadeAtiva";

export interface AgendaConfig {
  id: string;
  dominio: string;
  unidade_id: number | null;
  tipo: string;
  nome: string;
  slug: string;
  ativo: boolean;
  horario_inicio: string;
  horario_fim: string;
  intervalo_minutos: number;
  dias_funcionamento: number[];
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  descricao_publica: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgendaServico {
  id: string;
  agenda_config_id: string;
  produto_id: number;
  duracao_minutos: number;
  ativo: boolean;
  created_at: string;
  produto?: {
    id: number;
    nome: string;
    preco_venda: number | null;
  };
}

export interface Agendamento {
  id: string;
  dominio: string;
  unidade_id: number | null;
  agenda_config_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  produto_id: number | null;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAgenda() {
  const { toast } = useToast();
  const { unidadeAtiva } = useUnidadeAtiva();
  const [isLoading, setIsLoading] = useState(true);
  const [configs, setConfigs] = useState<AgendaConfig[]>([]);
  const [servicos, setServicos] = useState<AgendaServico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [dominio, setDominio] = useState<string | null>(null);

  useEffect(() => {
    const storedDominio = localStorage.getItem("user_dominio");
    if (storedDominio) {
      setDominio(storedDominio);
    }
  }, []);

  useEffect(() => {
    if (dominio && unidadeAtiva) {
      fetchData();
    }
  }, [dominio, unidadeAtiva]);

  const fetchData = async () => {
    if (!dominio || !unidadeAtiva) return;
    
    setIsLoading(true);
    try {
      // Fetch configs
      const { data: configsData, error: configsError } = await supabase
        .from("tb_agenda_config")
        .select("*")
        .eq("dominio", dominio)
        .eq("unidade_id", unidadeAtiva.id);

      if (configsError) throw configsError;
      setConfigs((configsData || []) as AgendaConfig[]);

      // Fetch agendamentos
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from("tb_agendamentos")
        .select("*")
        .eq("dominio", dominio)
        .eq("unidade_id", unidadeAtiva.id)
        .order("data_inicio", { ascending: true });

      if (agendamentosError) throw agendamentosError;
      setAgendamentos((agendamentosData || []) as Agendamento[]);

      // Fetch servicos for all configs
      if (configsData && configsData.length > 0) {
        const configIds = configsData.map(c => c.id);
        const { data: servicosData, error: servicosError } = await supabase
          .from("tb_agenda_servicos")
          .select(`
            *,
            produto:tb_produtos(id, nome, preco_venda)
          `)
          .in("agenda_config_id", configIds);

        if (servicosError) throw servicosError;
        setServicos((servicosData || []) as AgendaServico[]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados da agenda:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da agenda.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: Partial<AgendaConfig>) => {
    if (!dominio || !unidadeAtiva) return null;

    // Ensure required fields are present
    if (!config.slug) {
      toast({
        title: "Erro",
        description: "Slug é obrigatório.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("tb_agenda_config")
        .insert([{
          tipo: config.tipo || 'servicos',
          nome: config.nome || 'Minha Agenda',
          slug: config.slug,
          ativo: config.ativo ?? true,
          horario_inicio: config.horario_inicio || '08:00:00',
          horario_fim: config.horario_fim || '18:00:00',
          intervalo_minutos: config.intervalo_minutos || 30,
          dias_funcionamento: config.dias_funcionamento || [1, 2, 3, 4, 5],
          dominio,
          unidade_id: unidadeAtiva.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agenda criada com sucesso!",
      });

      await fetchData();
      return data as AgendaConfig;
    } catch (error: any) {
      console.error("Erro ao criar agenda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar agenda.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateConfig = async (id: string, updates: Partial<AgendaConfig>) => {
    try {
      const { error } = await supabase
        .from("tb_agenda_config")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agenda atualizada com sucesso!",
      });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar agenda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar agenda.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_agenda_config")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agenda excluída com sucesso!",
      });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir agenda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir agenda.",
        variant: "destructive",
      });
      return false;
    }
  };

  const createAgendamento = async (agendamento: Partial<Agendamento>) => {
    if (!dominio || !unidadeAtiva) return null;

    // Ensure required fields are present
    if (!agendamento.agenda_config_id || !agendamento.data_inicio || !agendamento.data_fim || !agendamento.titulo) {
      toast({
        title: "Erro",
        description: "Campos obrigatórios não preenchidos.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("tb_agendamentos")
        .insert([{
          agenda_config_id: agendamento.agenda_config_id,
          titulo: agendamento.titulo,
          data_inicio: agendamento.data_inicio,
          data_fim: agendamento.data_fim,
          tipo: agendamento.tipo || 'servico',
          descricao: agendamento.descricao || null,
          cliente_nome: agendamento.cliente_nome || null,
          cliente_telefone: agendamento.cliente_telefone || null,
          cliente_email: agendamento.cliente_email || null,
          produto_id: agendamento.produto_id || null,
          status: agendamento.status || 'agendado',
          observacoes: agendamento.observacoes || null,
          dominio,
          unidade_id: unidadeAtiva.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });

      await fetchData();
      return data as Agendamento;
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar agendamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAgendamento = async (id: string, updates: Partial<Agendamento>) => {
    try {
      const { error } = await supabase
        .from("tb_agendamentos")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso!",
      });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar agendamento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAgendamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_agendamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir agendamento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateServicos = async (configId: string, servicosData: { produto_id: number; duracao_minutos: number; ativo: boolean }[]) => {
    try {
      // Delete existing
      await supabase
        .from("tb_agenda_servicos")
        .delete()
        .eq("agenda_config_id", configId);

      // Insert new
      if (servicosData.length > 0) {
        const { error } = await supabase
          .from("tb_agenda_servicos")
          .insert(servicosData.map(s => ({
            ...s,
            agenda_config_id: configId,
          })));

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Serviços atualizados com sucesso!",
      });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar serviços:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar serviços.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isLoading,
    configs,
    servicos,
    agendamentos,
    dominio,
    fetchData,
    createConfig,
    updateConfig,
    deleteConfig,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
    updateServicos,
  };
}
