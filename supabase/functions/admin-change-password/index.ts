import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { dominio, nova_senha, master_password } = await req.json()

    if (!dominio || !nova_senha || !master_password) {
      return new Response(
        JSON.stringify({ error: 'dominio, nova_senha e master_password são obrigatórios' }),
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
        JSON.stringify({ error: 'Usuário não encontrado para este domínio' }),
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
