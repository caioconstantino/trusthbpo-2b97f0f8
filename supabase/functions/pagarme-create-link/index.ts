const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateLinkRequest {
  planName: string
  planPrice: number // em centavos
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const pagarmeApiKey = Deno.env.get('PAGARME_SDX')
    
    if (!pagarmeApiKey) {
      console.error('PAGARME_SDX secret not configured')
      return new Response(
        JSON.stringify({ error: 'Pagar.me API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('API Key starts with:', pagarmeApiKey.substring(0, 10))

    const body: CreateLinkRequest = await req.json()
    const { planName, planPrice } = body

    console.log('Creating payment link for:', { planName, planPrice })

    if (!planName || !planPrice) {
      return new Response(
        JSON.stringify({ error: 'planName and planPrice are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Payload mínimo baseado na documentação oficial
    const pagarmePayload = {
      name: planName,
      type: 'order',
      payment_settings: {
        accepted_payment_methods: ['credit_card'],
        credit_card_settings: {
          operation_type: 'auth_and_capture',
          installments: [
            { number: 1, total: planPrice }
          ]
        }
      },
      cart_settings: {
        items: [
          {
            name: planName,
            amount: planPrice,
            default_quantity: 1
          }
        ]
      }
    }

    console.log('Payload:', JSON.stringify(pagarmePayload, null, 2))

    // Autenticação Basic - API Key como username, password vazio
    const credentials = btoa(`${pagarmeApiKey}:`)
    console.log('Auth header created')

    const pagarmeResponse = await fetch('https://sdx-api.pagar.me/core/v5/paymentlinks', {
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
          status: pagarmeResponse.status,
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
