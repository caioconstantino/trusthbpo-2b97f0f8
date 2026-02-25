import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const masterPass = Deno.env.get('MASTER_PASS_ADM')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { dominio, nova_senha, master_password, action, email, nome } = await req.json()

    if (!dominio || !master_password) {
      return new Response(
        JSON.stringify({ error: 'dominio e master_password são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate master password
    if (master_password !== masterPass) {
      return new Response(
        JSON.stringify({ error: 'Senha master inválida' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ACTION: create_user - Create a new auth user and link to domain
    if (action === 'create_user') {
      if (!email || !nova_senha) {
        return new Response(
          JSON.stringify({ error: 'email e nova_senha são obrigatórios para criar usuário' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user already exists for this domain
      const { data: existingUser } = await supabase
        .from('tb_usuarios')
        .select('id')
        .eq('dominio', dominio)
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Já existe um usuário com este email neste domínio' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: nova_senha,
        email_confirm: true,
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the admin group for this domain
      const { data: grupo } = await supabase
        .from('tb_grupos_permissao')
        .select('id')
        .eq('dominio', dominio)
        .eq('nome', 'Administradores')
        .maybeSingle()

      // Create tb_usuarios record
      const { error: userInsertError } = await supabase
        .from('tb_usuarios')
        .insert({
          auth_user_id: authData.user.id,
          dominio,
          nome: nome || email,
          email,
          status: 'Ativo',
          grupo_id: grupo?.id || null,
        })

      if (userInsertError) {
        console.error('Error inserting usuario:', userInsertError)
        // Cleanup: delete the auth user if tb_usuarios insert fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: 'Erro ao vincular usuário: ' + userInsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Usuário criado com sucesso', email }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ACTION: change_password (default) - Change password of existing user
    if (!nova_senha) {
      return new Response(
        JSON.stringify({ error: 'nova_senha é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the user by domain in tb_usuarios
    const { data: usuario, error: userError } = await supabase
      .from('tb_usuarios')
      .select('auth_user_id, email')
      .eq('dominio', dominio)
      .limit(1)
      .single()

    if (userError || !usuario?.auth_user_id) {
      console.error('User not found:', userError)
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado para este domínio. Crie um usuário primeiro.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      usuario.auth_user_id,
      { password: nova_senha }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao alterar senha: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, email: usuario.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
