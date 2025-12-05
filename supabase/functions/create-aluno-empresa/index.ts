import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.log("SMTP not configured, skipping email");
    return false;
  }

  try {
    // Using Deno's built-in SMTP (via fetch to an SMTP relay or using a library)
    // For simplicity, we'll use a basic approach with nodemailer-like structure
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
    
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort || "587"),
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: smtpFromEmail || smtpUser,
      to,
      subject,
      content: "auto",
      html,
    });

    await client.close();
    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

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
    } = await req.json();

    console.log("Creating student registration for:", email);

    // Validar campos obrigatórios
    if (!email || !nome || !professor_id || !escola_id) {
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
      .maybeSingle();

    if (existingAluno) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado como aluno" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar domínio único baseado no nome do aluno
    const baseSlug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 15);

    let dominio = `edu-${baseSlug}`;
    let counter = 1;

    // Verificar se domínio já existe e gerar um único
    while (true) {
      const { data: existingDomain } = await supabaseAdmin
        .from("tb_clientes_saas")
        .select("id")
        .eq("dominio", dominio)
        .maybeSingle();

      if (!existingDomain) break;
      dominio = `edu-${baseSlug}${counter}`;
      counter++;
    }

    console.log("Generated domain:", dominio);

    // Calcular data de expiração (1 ano a partir de hoje)
    const hoje = new Date();
    const umAno = new Date(hoje);
    umAno.setFullYear(umAno.getFullYear() + 1);

    // Criar registro do aluno (sem auth_user_id ainda)
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
        dominio,
        ativo: true,
      })
      .select()
      .single();

    if (alunoError) {
      console.error("Aluno error:", alunoError);
      return new Response(
        JSON.stringify({ error: alunoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Aluno created:", alunoData.id);

    // Criar registro do cliente SaaS (empresa do aluno com licença educacional)
    const { data: clienteData, error: clienteError } = await supabaseAdmin
      .from("tb_clientes_saas")
      .insert({
        dominio,
        razao_social: `Empresa de ${nome}`,
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
      // Rollback: deletar aluno
      await supabaseAdmin.from("tb_alunos").delete().eq("id", alunoData.id);
      return new Response(
        JSON.stringify({ error: clienteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cliente SaaS created for domain:", dominio);

    // Enviar email com link para criar usuário
    const baseUrl = "https://trusthbpo.lovable.app";
    const createUserLink = `${baseUrl}/criar-usuario?dominio=${dominio}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0A1E3F 0%, #1a365d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #D4AF37; margin: 0; font-size: 24px; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37; }
          .button { display: inline-block; background: #D4AF37; color: #0A1E3F; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 TrustHBPO Educacional</h1>
          </div>
          <div class="content">
            <h2>Olá, ${nome}!</h2>
            <p>Seu cadastro como aluno foi realizado com sucesso! Agora você pode criar sua conta e começar a usar o sistema.</p>
            
            <div class="highlight">
              <p><strong>Seu domínio de acesso:</strong></p>
              <p style="font-size: 20px; color: #0A1E3F; font-weight: bold;">${dominio}</p>
              <span class="badge">Licença Educacional - 1 ano grátis</span>
            </div>
            
            <p>Clique no botão abaixo para criar sua senha e acessar o sistema:</p>
            
            <center>
              <a href="${createUserLink}" class="button">Criar Minha Conta</a>
            </center>
            
            <p style="font-size: 14px; color: #666;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${createUserLink}">${createUserLink}</a>
            </p>
            
            <div class="footer">
              <p>Este é um email automático do programa educacional TrustHBPO.</p>
              <p>Sua licença é válida durante o período do seu curso e controlada pelo seu professor.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSent = await sendEmail(
      email,
      "🎓 Bem-vindo ao TrustHBPO Educacional - Crie sua conta",
      emailHtml
    );

    return new Response(
      JSON.stringify({
        success: true,
        aluno_id: alunoData.id,
        dominio,
        email_sent: emailSent,
        message: "Cadastro realizado! Verifique seu email para criar sua conta.",
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
