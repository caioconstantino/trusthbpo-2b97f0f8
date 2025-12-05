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
      // Dados da empresa
      nome_empresa,
      senha,
    } = await req.json();

    console.log("Creating student account with company for:", email);

    // Validar campos obrigatórios
    if (!email || !senha || !nome || !nome_empresa || !professor_id || !escola_id) {
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

    // Gerar domínio único baseado no nome da empresa
    const baseSlug = nome_empresa
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);

    let dominio = baseSlug;
    let counter = 1;

    // Verificar se domínio já existe e gerar um único
    while (true) {
      const { data: existingDomain } = await supabaseAdmin
        .from("tb_clientes_saas")
        .select("id")
        .eq("dominio", dominio)
        .single();

      if (!existingDomain) break;
      dominio = `${baseSlug}${counter}`;
      counter++;
    }

    console.log("Generated domain:", dominio);

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

    // Calcular data de expiração (1 ano a partir de hoje)
    const hoje = new Date();
    const umAno = new Date(hoje);
    umAno.setFullYear(umAno.getFullYear() + 1);

    // Criar registro do aluno
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
        dominio,
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

    // Criar registro do cliente SaaS (empresa do aluno)
    const { data: clienteData, error: clienteError } = await supabaseAdmin
      .from("tb_clientes_saas")
      .insert({
        dominio,
        razao_social: nome_empresa,
        responsavel: nome,
        email,
        telefone: telefone?.replace(/\D/g, "") || null,
        status: "Ativo",
        tipo_conta: "aluno",
        aluno_id: alunoData.id,
        plano: "Educacional",
        ultimo_pagamento: hoje.toISOString().split("T")[0],
        proximo_pagamento: umAno.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (clienteError) {
      console.error("Cliente error:", clienteError);
      // Rollback: deletar aluno e usuário auth
      await supabaseAdmin.from("tb_alunos").delete().eq("id", alunoData.id);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: clienteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cliente SaaS created for domain:", dominio);

    // Criar grupo de permissões "Administradores"
    const { data: grupoData, error: grupoError } = await supabaseAdmin
      .from("tb_grupos_permissao")
      .insert({
        nome: "Administradores",
        descricao: "Grupo com acesso total ao sistema",
        dominio,
      })
      .select()
      .single();

    if (grupoError) {
      console.error("Grupo error:", grupoError);
    } else {
      // Criar permissões para todos os módulos
      const modulos = [
        "Dashboard",
        "PDV",
        "Produtos",
        "Clientes",
        "Compras",
        "Contas a Pagar",
        "Contas a Receber",
        "Central de Contas",
        "Configurações",
      ];

      for (const modulo of modulos) {
        await supabaseAdmin.from("tb_grupos_permissao_modulos").insert({
          grupo_id: grupoData.id,
          modulo,
          visualizar: true,
          editar: true,
          excluir: true,
        });
      }

      console.log("Permissions created for group:", grupoData.id);

      // Criar usuário do sistema
      const { error: usuarioError } = await supabaseAdmin.from("tb_usuarios").insert({
        nome,
        email,
        dominio,
        auth_user_id: authUserId,
        grupo_id: grupoData.id,
        status: "Ativo",
      });

      if (usuarioError) {
        console.error("Usuario error:", usuarioError);
      } else {
        console.log("Usuario created successfully");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        aluno_id: alunoData.id,
        dominio,
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
