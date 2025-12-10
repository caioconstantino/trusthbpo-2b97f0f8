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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { dominio, action, pdvs_adicionais, empresas_adicionais, usuarios_adicionais, produtos_adicionais } = body

    if (!dominio) {
      return new Response(
        JSON.stringify({ error: 'Domínio é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle update actions
    if (action === 'update_pdvs' && typeof pdvs_adicionais === 'number') {
      console.log(`Updating PDVs adicionais for ${dominio}: ${pdvs_adicionais}`)
      const { error: updateError } = await supabase
        .from('tb_clientes_saas')
        .update({ pdvs_adicionais })
        .eq('dominio', dominio)

      if (updateError) {
        console.error('Error updating PDVs:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar PDVs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'PDVs atualizados com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_empresas' && typeof empresas_adicionais === 'number') {
      console.log(`Updating Empresas adicionais for ${dominio}: ${empresas_adicionais}`)
      const { error: updateError } = await supabase
        .from('tb_clientes_saas')
        .update({ empresas_adicionais })
        .eq('dominio', dominio)

      if (updateError) {
        console.error('Error updating Empresas:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar Empresas' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Empresas atualizadas com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_usuarios' && typeof usuarios_adicionais === 'number') {
      console.log(`Updating Usuarios adicionais for ${dominio}: ${usuarios_adicionais}`)
      const { error: updateError } = await supabase
        .from('tb_clientes_saas')
        .update({ usuarios_adicionais })
        .eq('dominio', dominio)

      if (updateError) {
        console.error('Error updating Usuarios:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar Usuários' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Usuários atualizados com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_produtos' && typeof produtos_adicionais === 'number') {
      console.log(`Updating Produtos adicionais for ${dominio}: ${produtos_adicionais}`)
      const { error: updateError } = await supabase
        .from('tb_clientes_saas')
        .update({ produtos_adicionais })
        .eq('dominio', dominio)

      if (updateError) {
        console.error('Error updating Produtos:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar Produtos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Produtos atualizados com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default: fetch customer data
    const { data: cliente, error } = await supabase
      .from('tb_clientes_saas')
      .select('razao_social, email, telefone, cpf_cnpj, dominio, plano, status, ultimo_pagamento, proximo_pagamento, tipo_conta, aluno_id, pdvs_adicionais, empresas_adicionais, usuarios_adicionais, produtos_adicionais, agenda_ativa')
      .eq('dominio', dominio)
      .maybeSingle()

    if (error) {
      console.error('Error fetching customer:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ cliente }),
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
