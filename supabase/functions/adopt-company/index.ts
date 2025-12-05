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
      aluno_id,
      razao_social,
      dominio,
      senha,
      cpf_cnpj,
      email,
      telefone,
      responsavel,
      observacoes,
    } = await req.json();

    console.log("Adopting company for aluno:", aluno_id);

    // Validar campos obrigatórios
    if (!aluno_id || !razao_social || !dominio || !senha) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos (aluno_id, razao_social, dominio, senha)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se aluno existe e está ativo
    const { data: alunoData, error: alunoError } = await supabaseAdmin
      .from("tb_alunos")
      .select("id, nome, email, ativo")
      .eq("id", aluno_id)
      .maybeSingle();

    if (alunoError || !alunoData) {
      return new Response(
        JSON.stringify({ error: "Aluno não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!alunoData.ativo) {
      return new Response(
        JSON.stringify({ error: "Conta de aluno inativa. Entre em contato com seu professor." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se domínio já existe
    const { data: existingDomain } = await supabaseAdmin
      .from("tb_clientes_saas")
      .select("id")
      .eq("dominio", dominio)
      .maybeSingle();

    if (existingDomain) {
      return new Response(
        JSON.stringify({ error: "Este domínio já está em uso" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Usar email do aluno ou o email fornecido
    const emailUsuario = email || alunoData.email;

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailUsuario,
      password: senha,
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth error:", authError);
      // Se o usuário já existe, tentar buscar
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Este email já está registrado no sistema. Use outro email ou faça login na empresa existente." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth user created:", authData.user.id);

    // Calcular data de expiração (1 ano a partir de hoje)
    const hoje = new Date();
    const umAno = new Date(hoje);
    umAno.setFullYear(umAno.getFullYear() + 1);

    // Criar registro do cliente SaaS (empresa adotada)
    const { data: clienteData, error: clienteError } = await supabaseAdmin
      .from("tb_clientes_saas")
      .insert({
        dominio,
        razao_social,
        cpf_cnpj: cpf_cnpj || null,
        email: emailUsuario,
        telefone: telefone?.replace(/\D/g, "") || null,
        responsavel: responsavel || alunoData.nome,
        observacoes: observacoes || null,
        status: "Ativo",
        tipo_conta: "aluno",
        aluno_id,
        plano: "Educacional",
        ultimo_pagamento: hoje.toISOString().split("T")[0],
        proximo_pagamento: umAno.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (clienteError) {
      console.error("Cliente error:", clienteError);
      // Rollback: deletar usuário auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: clienteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cliente SaaS created:", clienteData.id);

    // Criar grupo de permissões "Administradores" com todas as permissões
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
      // Rollback
      await supabaseAdmin.from("tb_clientes_saas").delete().eq("id", clienteData.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Erro ao criar grupo de permissões" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Grupo permissao created:", grupoData.id);

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

    const permissoes = modulos.map((modulo) => ({
      grupo_id: grupoData.id,
      modulo,
      visualizar: true,
      editar: true,
      excluir: true,
    }));

    const { error: permissoesError } = await supabaseAdmin
      .from("tb_grupos_permissao_modulos")
      .insert(permissoes);

    if (permissoesError) {
      console.error("Permissoes error:", permissoesError);
    }

    console.log("Permissoes created for grupo:", grupoData.id);

    // Criar registro do usuário na tb_usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from("tb_usuarios")
      .insert({
        auth_user_id: authData.user.id,
        email: emailUsuario,
        nome: alunoData.nome,
        dominio,
        grupo_id: grupoData.id,
        status: "Ativo",
      });

    if (usuarioError) {
      console.error("Usuario error:", usuarioError);
      // Não fazer rollback completo, a empresa foi criada
    }

    console.log("Usuario created for dominio:", dominio);

    return new Response(
      JSON.stringify({
        success: true,
        cliente_id: clienteData.id,
        dominio,
        grupo_id: grupoData.id,
        message: `Empresa "${razao_social}" adotada com sucesso! Você já pode fazer login com o domínio "${dominio}" e a senha cadastrada.`,
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