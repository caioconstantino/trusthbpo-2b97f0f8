import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUnidadeAtivaId } from "@/hooks/useUnidadeAtiva";

interface Session {
  id: string;
  dominio: string;
  unidade_id: number | null;
  usuario_id: string;
  usuario_nome: string;
  caixa_nome: string;
  valor_abertura: number;
  status: string;
  data_abertura: string;
}

export const usePdvSession = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSession, setNeedsSession] = useState(false);

  const dominio = localStorage.getItem("user_dominio") || "";
  const usuarioNome = localStorage.getItem("user_nome") || "Usuário";
  const unidadeId = getUnidadeAtivaId();

  useEffect(() => {
    checkOpenSession();
  }, []);

  const checkOpenSession = async () => {
    if (!dominio) {
      setLoading(false);
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("tb_sessoes_caixa")
        .select("*")
        .eq("dominio", dominio)
        .eq("usuario_id", authData.user.id)
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false })
        .limit(1);

      if (unidadeId) {
        query = query.eq("unidade_id", unidadeId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking session:", error);
      }

      if (data) {
        setSession(data as Session);
        setNeedsSession(false);
      } else {
        setNeedsSession(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (valorAbertura: number, caixaNome: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase
        .from("tb_sessoes_caixa")
        .insert({
          dominio,
          unidade_id: unidadeId,
          usuario_id: authData.user.id,
          usuario_nome: usuarioNome,
          caixa_nome: caixaNome,
          valor_abertura: valorAbertura,
          status: "aberto"
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao abrir caixa",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setSession(data as Session);
      setNeedsSession(false);
      toast({
        title: "Caixa aberto!",
        description: `${caixaNome} iniciado com R$ ${valorAbertura.toFixed(2)}`
      });
      return true;
    } catch (error) {
      console.error("Error opening session:", error);
      return false;
    }
  };

  const closeSession = async (valorFechamento: number, observacoes?: string) => {
    if (!session) return false;

    try {
      const { error } = await supabase
        .from("tb_sessoes_caixa")
        .update({
          status: "fechado",
          valor_fechamento: valorFechamento,
          data_fechamento: new Date().toISOString(),
          observacoes
        })
        .eq("id", session.id);

      if (error) {
        toast({
          title: "Erro ao fechar caixa",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setSession(null);
      setNeedsSession(true);
      toast({
        title: "Caixa fechado!",
        description: "Sessão encerrada com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Error closing session:", error);
      return false;
    }
  };

  return {
    session,
    loading,
    needsSession,
    openSession,
    closeSession,
    usuarioNome
  };
};
