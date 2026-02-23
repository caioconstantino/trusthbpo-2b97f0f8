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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    console.log("Verificando clientes com pagamento vencido...");
    console.log("Data de hoje:", hoje);

    // Buscar clientes ativos cujo proximo_pagamento já passou
    const { data: clientesVencidos, error: fetchError } = await supabaseAdmin
      .from("tb_clientes_saas")
      .select("id, dominio, razao_social, proximo_pagamento, status, tipo_conta")
      .eq("status", "Ativo")
      .not("tipo_conta", "eq", "aluno")
      .lt("proximo_pagamento", hoje);

    if (fetchError) {
      console.error("Erro ao buscar clientes:", fetchError);
      throw fetchError;
    }

    console.log(`Encontrados ${clientesVencidos?.length || 0} clientes com pagamento vencido`);

    let inativados = 0;

    if (clientesVencidos && clientesVencidos.length > 0) {
      const ids = clientesVencidos.map(c => c.id);

      const { error: updateError } = await supabaseAdmin
        .from("tb_clientes_saas")
        .update({ status: "Inativo" })
        .in("id", ids);

      if (updateError) {
        console.error("Erro ao atualizar clientes:", updateError);
        throw updateError;
      }

      inativados = ids.length;
      console.log(`${inativados} clientes inativados com sucesso`);

      clientesVencidos.forEach(c => {
        console.log(`- ${c.dominio} (${c.razao_social}) - Próximo pagamento: ${c.proximo_pagamento}`);
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${clientesVencidos?.length || 0} clientes verificados`,
        inativados
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro na função check-inactive-clients:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
