import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadeAtiva } from "./useUnidadeAtiva";
import { toast } from "@/hooks/use-toast";

export interface PropostaModelo {
  id: string;
  dominio: string;
  unidade_id: number | null;
  nome: string;
  descricao: string | null;
  layout: PropostaBlock[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Proposta {
  id: string;
  dominio: string;
  unidade_id: number | null;
  modelo_id: string | null;
  numero: number;
  cliente_id: number | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  titulo: string;
  layout: PropostaBlock[];
  condicoes: string | null;
  validade_dias: number;
  status: string;
  total: number;
  observacoes: string | null;
  venda_id: string | null;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
}

export interface PropostaItem {
  id: string;
  proposta_id: string;
  produto_id: number | null;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentual: number;
  total: number;
  ordem: number;
  created_at: string;
  produto?: {
    id: number;
    nome: string;
    preco_venda: number;
  };
}

export interface PropostaBlock {
  id: string;
  type: "header" | "items" | "conditions" | "text" | "divider";
  content?: string;
  config?: Record<string, unknown>;
}

export const usePropostas = () => {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [modelos, setModelos] = useState<PropostaModelo[]>([]);
  const [loading, setLoading] = useState(true);
  const { unidadeAtiva } = useUnidadeAtiva();

  const dominio = localStorage.getItem("user_dominio") || "";

  const fetchPropostas = async () => {
    if (!dominio) return;

    setLoading(true);
    try {
      let query = supabase
        .from("tb_propostas")
        .select("*")
        .eq("dominio", dominio)
        .order("created_at", { ascending: false });

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const parsedData = (data || []).map((p) => ({
        ...p,
        layout: typeof p.layout === "string" ? JSON.parse(p.layout) : p.layout || [],
      }));

      setPropostas(parsedData);
    } catch (error) {
      console.error("Erro ao buscar propostas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as propostas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModelos = async () => {
    if (!dominio) return;

    try {
      let query = supabase
        .from("tb_propostas_modelos")
        .select("*")
        .eq("dominio", dominio)
        .eq("ativo", true)
        .order("nome");

      if (unidadeAtiva?.id) {
        query = query.eq("unidade_id", unidadeAtiva.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const parsedData = (data || []).map((m) => ({
        ...m,
        layout: typeof m.layout === "string" ? JSON.parse(m.layout) : m.layout || [],
      }));

      setModelos(parsedData);
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
    }
  };

  const createProposta = async (data: Partial<Proposta>) => {
    try {
      // Buscar próximo número
      const { data: numeroData, error: numeroError } = await supabase.rpc(
        "get_next_proposta_numero",
        { p_dominio: dominio, p_unidade_id: unidadeAtiva?.id || null }
      );

      if (numeroError) throw numeroError;

      const { data: newProposta, error } = await supabase
        .from("tb_propostas")
        .insert({
          dominio,
          unidade_id: unidadeAtiva?.id || null,
          numero: numeroData,
          titulo: data.titulo,
          modelo_id: data.modelo_id,
          cliente_id: data.cliente_id,
          cliente_nome: data.cliente_nome,
          cliente_email: data.cliente_email,
          cliente_telefone: data.cliente_telefone,
          layout: JSON.stringify(data.layout || []),
          validade_dias: data.validade_dias,
          status: data.status,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Proposta criada com sucesso",
      });

      await fetchPropostas();
      return newProposta;
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a proposta",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProposta = async (id: string, data: Partial<Proposta>) => {
    try {
      const updateData = {
        ...data,
        layout: data.layout ? JSON.stringify(data.layout) : undefined,
      };

      const { error } = await supabase
        .from("tb_propostas")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Proposta atualizada com sucesso",
      });

      await fetchPropostas();
    } catch (error) {
      console.error("Erro ao atualizar proposta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a proposta",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProposta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_propostas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Proposta excluída com sucesso",
      });

      await fetchPropostas();
    } catch (error) {
      console.error("Erro ao excluir proposta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a proposta",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createModelo = async (data: Partial<PropostaModelo>) => {
    try {
      const { data: newModelo, error } = await supabase
        .from("tb_propostas_modelos")
        .insert({
          dominio,
          unidade_id: unidadeAtiva?.id || null,
          nome: data.nome || "",
          descricao: data.descricao,
          layout: JSON.stringify(data.layout || []),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Modelo criado com sucesso",
      });

      await fetchModelos();
      return newModelo;
    } catch (error) {
      console.error("Erro ao criar modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o modelo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateModelo = async (id: string, data: Partial<PropostaModelo>) => {
    try {
      const updateData = {
        ...data,
        layout: data.layout ? JSON.stringify(data.layout) : undefined,
      };

      const { error } = await supabase
        .from("tb_propostas_modelos")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Modelo atualizado com sucesso",
      });

      await fetchModelos();
    } catch (error) {
      console.error("Erro ao atualizar modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o modelo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteModelo = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tb_propostas_modelos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Modelo excluído com sucesso",
      });

      await fetchModelos();
    } catch (error) {
      console.error("Erro ao excluir modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o modelo",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Funções para itens da proposta
  const fetchItens = async (propostaId: string): Promise<PropostaItem[]> => {
    try {
      const { data, error } = await supabase
        .from("tb_propostas_itens")
        .select("*, produto:tb_produtos(id, nome, preco_venda)")
        .eq("proposta_id", propostaId)
        .order("ordem");

      if (error) throw error;
      return (data || []) as PropostaItem[];
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      return [];
    }
  };

  const saveItens = async (propostaId: string, itens: Partial<PropostaItem>[]) => {
    try {
      // Deletar itens existentes
      await supabase
        .from("tb_propostas_itens")
        .delete()
        .eq("proposta_id", propostaId);

      // Inserir novos itens
      if (itens.length > 0) {
        const { error } = await supabase
          .from("tb_propostas_itens")
          .insert(
            itens.map((item, index) => ({
              proposta_id: propostaId,
              produto_id: item.produto_id,
              descricao: item.descricao,
              quantidade: item.quantidade || 1,
              preco_unitario: item.preco_unitario || 0,
              desconto_percentual: item.desconto_percentual || 0,
              total: item.total || 0,
              ordem: index,
            }))
          );

        if (error) throw error;
      }

      // Atualizar total da proposta
      const total = itens.reduce((acc, item) => acc + (item.total || 0), 0);
      await supabase
        .from("tb_propostas")
        .update({ total })
        .eq("id", propostaId);

    } catch (error) {
      console.error("Erro ao salvar itens:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (dominio) {
      fetchPropostas();
      fetchModelos();
    }
  }, [dominio, unidadeAtiva]);

  return {
    propostas,
    modelos,
    loading,
    fetchPropostas,
    fetchModelos,
    createProposta,
    updateProposta,
    deleteProposta,
    createModelo,
    updateModelo,
    deleteModelo,
    fetchItens,
    saveItens,
  };
};
