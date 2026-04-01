import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Use POST" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { dominio, unidade_id, produtos } = await req.json();

    if (!dominio || !Array.isArray(produtos) || produtos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Payload inválido: envie { dominio, unidade_id?, produtos: [{ codigo, quantidade }] }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find active sincronizar_estoque integrations for this domain
    const { data: integracoes, error: intError } = await supabase
      .from("tb_integracoes")
      .select("*")
      .eq("dominio", dominio)
      .eq("tipo", "sincronizar_estoque")
      .eq("ativo", true);

    if (intError) throw intError;

    if (!integracoes || integracoes.length === 0) {
      return new Response(
        JSON.stringify({ status: "skip", mensagem: "Nenhuma integração de estoque sincronizado ativa." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { integracao_id: string; status: string; mensagem: string }[] = [];

    for (const integracao of integracoes) {
      const callbackUrl = (integracao.config as any)?.callback_url;

      if (!callbackUrl) {
        results.push({ integracao_id: integracao.id, status: "erro", mensagem: "callback_url não configurada" });
        continue;
      }

      try {
        const payload = {
          tipo: "atualizacao_estoque",
          dominio,
          unidade_id: unidade_id || integracao.unidade_id,
          produtos,
          timestamp: new Date().toISOString(),
        };

        const response = await fetch(callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const respText = await response.text().catch(() => "");
        const status = response.ok ? "sucesso" : "erro";
        const mensagem = response.ok
          ? `Estoque enviado: ${produtos.length} produto(s). Status: ${response.status}`
          : `Erro do site: ${response.status} - ${respText.substring(0, 200)}`;

        // Log
        await supabase.from("tb_integracoes_logs").insert({
          integracao_id: integracao.id,
          status,
          payload,
          resposta: mensagem,
        });

        results.push({ integracao_id: integracao.id, status, mensagem });
      } catch (fetchError: unknown) {
        const errMsg = fetchError instanceof Error ? fetchError.message : "Erro de conexão";
        await supabase.from("tb_integracoes_logs").insert({
          integracao_id: integracao.id,
          status: "erro",
          payload: { produtos },
          resposta: errMsg,
        });
        results.push({ integracao_id: integracao.id, status: "erro", mensagem: errMsg });
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("sync-stock-out error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
