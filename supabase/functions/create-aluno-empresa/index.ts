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

    const {
      // Dados do aluno
      professor_id,
      escola_id,
      nome,
      email,
      telefone,
      cpf,
      data_nascimento,
      endereco_cep,
      endereco_logradouro,
      endereco_numero,
      endereco_complemento,
      endereco_bairro,
      endereco_cidade,
      endereco_estado,
      senha,
    } = await req.json();

    console.log("Creating student account for:", email);

    // Validar campos obrigatórios
    if (!email || !senha || !nome || !professor_id || !escola_id) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se email já existe em tb_alunos
    const { data: existingAluno } = await supabaseAdmin
      .from("tb_alunos")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAluno) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado como aluno" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        tipo: "aluno",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = authData.user.id;
    console.log("Auth user created:", authUserId);

    // Criar registro do aluno (sem domínio ainda - será criado quando criar a empresa)
    const { data: alunoData, error: alunoError } = await supabaseAdmin
      .from("tb_alunos")
      .insert({
        professor_id,
        escola_id,
        nome,
        email,
        telefone: telefone?.replace(/\D/g, "") || null,
        cpf: cpf?.replace(/\D/g, "") || null,
        data_nascimento: data_nascimento || null,
        endereco_cep: endereco_cep?.replace(/\D/g, "") || null,
        endereco_logradouro: endereco_logradouro || null,
        endereco_numero: endereco_numero || null,
        endereco_complemento: endereco_complemento || null,
        endereco_bairro: endereco_bairro || null,
        endereco_cidade: endereco_cidade || null,
        endereco_estado: endereco_estado?.toUpperCase() || null,
        auth_user_id: authUserId,
        ativo: true,
      })
      .select()
      .single();

    if (alunoError) {
      console.error("Aluno error:", alunoError);
      // Rollback: deletar usuário auth
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: alunoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Aluno created:", alunoData.id);

    return new Response(
      JSON.stringify({
        success: true,
        aluno_id: alunoData.id,
        message: "Cadastro realizado com sucesso! Você já pode fazer login.",
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
