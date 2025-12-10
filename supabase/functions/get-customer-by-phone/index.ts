import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Body inválido. Envie um JSON válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawTelefone = body?.telefone ?? body?.phone;
    if (!rawTelefone) {
      return new Response(
        JSON.stringify({ error: "Telefone é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telefone = String(rawTelefone).replace(/\D/g, "");
    if (!telefone) {
      return new Response(
        JSON.stringify({ error: "Telefone inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: cliente, error } = await supabase
      .from("tb_clientes_saas")
      .select(
        "id, razao_social, email, telefone, cpf_cnpj, dominio, plano, status, ultimo_pagamento, proximo_pagamento, tipo_conta, aluno_id, pdvs_adicionais, empresas_adicionais, usuarios_adicionais, produtos_adicionais, agenda_ativa, responsavel, observacoes"
      )
      .eq("telefone", telefone)
      .maybeSingle();

    if (error) {
      console.error("Error fetching customer by phone:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar dados." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cliente) {
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ cliente }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

