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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, nome, slug, escola_id } = await req.json();

    // Validate required fields
    if (!email || !password || !nome || !slug || !escola_id) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if slug already exists
    const { data: existingSlug } = await supabaseAdmin
      .from("tb_professores")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return new Response(
        JSON.stringify({ error: "Este slug já está em uso" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists in tb_professores
    const { data: existingEmail } = await supabaseAdmin
      .from("tb_professores")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create professor record
    const { data: professor, error: insertError } = await supabaseAdmin
      .from("tb_professores")
      .insert({
        escola_id,
        nome,
        email,
        slug,
        auth_user_id: authData.user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      // Rollback: delete auth user if professor insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Professor created successfully:", professor);

    return new Response(
      JSON.stringify({ success: true, professor, userId: authData.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
