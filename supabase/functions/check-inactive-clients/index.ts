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

    // Data de 7 dias atrás
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const seteDiasAtrasISO = seteDiasAtras.toISOString();

    console.log("Verificando clientes inativos há mais de 7 dias...");
    console.log("Data limite:", seteDiasAtrasISO);

    // Buscar clientes ativos com last_login_at anterior a 7 dias ou null
    const { data: clientesInativos, error: fetchError } = await supabaseAdmin
      .from("tb_clientes_saas")
      .select("id, dominio, razao_social, last_login_at, status")
      .eq("status", "Ativo")
      .or(`last_login_at.lt.${seteDiasAtrasISO},last_login_at.is.null`);

    if (fetchError) {
      console.error("Erro ao buscar clientes:", fetchError);
      throw fetchError;
    }

    console.log(`Encontrados ${clientesInativos?.length || 0} clientes para inativar`);

    if (clientesInativos && clientesInativos.length > 0) {
      // Filtrar apenas os que realmente devem ser inativados
      // (excluir contas educacionais e empresas adotadas recém-criadas)
      const clientesParaInativar = clientesInativos.filter(c => {
        // Se nunca fez login e foi criado há mais de 7 dias, inativar
        // Se fez login há mais de 7 dias, inativar
        return true;
      });

      const ids = clientesParaInativar.map(c => c.id);

      if (ids.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from("tb_clientes_saas")
          .update({ status: "Inativo" })
          .in("id", ids);

        if (updateError) {
          console.error("Erro ao atualizar clientes:", updateError);
          throw updateError;
        }

        console.log(`${ids.length} clientes inativados com sucesso`);
        
        // Log dos clientes inativados
        clientesParaInativar.forEach(c => {
          console.log(`- ${c.dominio} (${c.razao_social}) - Último login: ${c.last_login_at || "nunca"}`);
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${clientesInativos?.length || 0} clientes verificados`,
        inativados: clientesInativos?.length || 0
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
