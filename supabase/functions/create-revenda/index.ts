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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with anon key to verify admin
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client with service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.log("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem criar revendas." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { nome, email, senha, documento, telefone, slug } = await req.json();

    if (!nome || !email || !senha) {
      return new Response(
        JSON.stringify({ error: "Nome, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth user created:", authData.user?.id);

    // Generate slug if not provided
    const finalSlug = slug || nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Create revenda record using admin client (bypasses RLS)
    const { data: revendaData, error: revendaError } = await supabaseAdmin
      .from("tb_revendas")
      .insert({
        nome,
        email,
        documento: documento || null,
        telefone: telefone?.replace(/\D/g, "") || null,
        auth_user_id: authData.user?.id,
        slug: finalSlug,
      })
      .select()
      .single();

    if (revendaError) {
      console.error("Error creating revenda:", revendaError);
      // Rollback: delete the auth user if revenda creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
      return new Response(
        JSON.stringify({ error: revendaError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Revenda created:", revendaData.id);

    // Create default products for the reseller
    const { error: produtosError } = await supabaseAdmin
      .from("tb_revendas_produtos")
      .insert([
        {
          revenda_id: revendaData.id,
          produto_codigo: "basico",
          produto_nome: "Plano Básico",
          preco_original: 39.90,
          preco_revenda: 49.90,
        },
        {
          revenda_id: revendaData.id,
          produto_codigo: "pro",
          produto_nome: "Plano Pro",
          preco_original: 99.90,
          preco_revenda: 129.90,
        },
      ]);

    if (produtosError) {
      console.error("Error creating produtos:", produtosError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        revenda: revendaData,
        message: "Revenda criada com sucesso!" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
