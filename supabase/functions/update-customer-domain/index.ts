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

    const { originalDomain, newDomain } = await req.json()

    if (!originalDomain || !newDomain) {
      return new Response(
        JSON.stringify({ error: 'Domínio original e novo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if new domain is already taken (if different from original)
    if (originalDomain !== newDomain) {
      const { data: existingDomain } = await supabase
        .from('tb_clientes_saas')
        .select('dominio')
        .eq('dominio', newDomain)
        .maybeSingle()

      if (existingDomain) {
        return new Response(
          JSON.stringify({ error: 'Domínio já está em uso' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update the domain
      const { error: updateError } = await supabase
        .from('tb_clientes_saas')
        .update({ dominio: newDomain })
        .eq('dominio', originalDomain)

      if (updateError) {
        console.error('Error updating domain:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar domínio' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, dominio: newDomain }),
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
