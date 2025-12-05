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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { dominio } = await req.json();

    if (!dominio) {
      return new Response(
        JSON.stringify({ error: "Domínio é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar usuários do domínio
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from("tb_usuarios")
      .select("auth_user_id")
      .eq("dominio", dominio);

    if (usuariosError || !usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ last_sign_in_at: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o último login entre todos os usuários do domínio
    let lastSignIn: string | null = null;

    for (const usuario of usuarios) {
      if (usuario.auth_user_id) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(usuario.auth_user_id);
        
        if (authUser?.user?.last_sign_in_at) {
          if (!lastSignIn || new Date(authUser.user.last_sign_in_at) > new Date(lastSignIn)) {
            lastSignIn = authUser.user.last_sign_in_at;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ last_sign_in_at: lastSignIn }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});