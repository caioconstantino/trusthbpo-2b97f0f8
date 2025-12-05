const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateLinkRequest {
  planName: string
  planPrice: number // em centavos
  cupom?: string // código da revenda
  revendaId?: string // ID da revenda
  dominio?: string // domínio do cliente (para adicionais)
  tipo?: string // tipo de compra: 'plano', 'pdv_adicional', 'empresa_adicional'
  quantidade?: number // quantidade de adicionais
  // Novos campos para checkout completo
  billingPeriod?: 'mensal' | 'anual'
  additionalUsers?: number
  additionalCompanies?: number
  additionalPdvs?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const pagarmeApiKey = Deno.env.get('PAGARME')
    
    if (!pagarmeApiKey) {
      console.error('PAGARME secret not configured')
      return new Response(
        JSON.stringify({ error: 'Pagar.me API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateLinkRequest = await req.json()
    const { 
      planName, 
      planPrice, 
      cupom, 
      revendaId, 
      dominio, 
      tipo, 
      quantidade,
      billingPeriod,
      additionalUsers,
      additionalCompanies,
      additionalPdvs
    } = body

    console.log('Creating payment link for:', { 
      planName, 
      planPrice, 
      cupom, 
      revendaId, 
      dominio, 
      tipo, 
      quantidade,
      billingPeriod,
      additionalUsers,
      additionalCompanies,
      additionalPdvs
    })

    if (!planName || !planPrice) {
      return new Response(
        JSON.stringify({ error: 'planName and planPrice are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir descrição do item
    let itemDescription = planName
    const extras: string[] = []
    
    if (additionalUsers && additionalUsers > 0) {
      extras.push(`+${additionalUsers} usuário(s)`)
    }
    if (additionalCompanies && additionalCompanies > 0) {
      extras.push(`+${additionalCompanies} empresa(s)`)
    }
    if (additionalPdvs && additionalPdvs > 0) {
      extras.push(`+${additionalPdvs} PDV(s)`)
    }
    
    if (extras.length > 0) {
      itemDescription = `${planName} (${extras.join(', ')})`
    }
    
    if (billingPeriod === 'anual') {
      itemDescription = `${itemDescription} - Anual (18% desc.)`
    }

    // Payload com PIX e Cartão de Crédito
    const pagarmePayload: Record<string, unknown> = {
      name: itemDescription,
      type: 'order',
      payment_settings: {
        accepted_payment_methods: ['credit_card', 'pix'],
        credit_card_settings: {
          operation_type: 'auth_and_capture',
          installments: [
            { number: 1, total: planPrice }
          ]
        },
        pix_settings: {
          expires_in: 3600
        }
      },
      cart_settings: {
        items: [
          {
            name: itemDescription,
            amount: planPrice,
            default_quantity: 1
          }
        ]
      }
    }

    // Add metadata for processing
    pagarmePayload.metadata = {
      cupom: cupom || '',
      revenda_id: revendaId || '',
      dominio: dominio || '',
      tipo: tipo || 'plano',
      quantidade: quantidade || 1,
      plan_name: planName,
      billing_period: billingPeriod || 'mensal',
      additional_users: additionalUsers || 0,
      additional_companies: additionalCompanies || 0,
      additional_pdvs: additionalPdvs || 0
    }

    console.log('Payload:', JSON.stringify(pagarmePayload, null, 2))

    const credentials = btoa(`${pagarmeApiKey}:`)

    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/paymentlinks', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(pagarmePayload)
    })

    const responseText = await pagarmeResponse.text()
    console.log('Pagar.me response status:', pagarmeResponse.status)
    console.log('Pagar.me response:', responseText)

    let pagarmeData
    try {
      pagarmeData = JSON.parse(responseText)
    } catch {
      pagarmeData = { raw: responseText }
    }

    if (!pagarmeResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment link', 
          details: pagarmeData 
        }),
        { status: pagarmeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink: pagarmeData.url,
        linkId: pagarmeData.id,
        data: pagarmeData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
