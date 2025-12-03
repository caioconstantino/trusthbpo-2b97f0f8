const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateLinkRequest {
  planName: string
  planPrice: number // em centavos
  customerEmail?: string
  customerName?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    const body: CreateLinkRequest = await req.json()
    const { planName, planPrice, customerEmail, customerName } = body

    console.log('Creating payment link for:', { planName, planPrice, customerEmail })

    // Validação
    if (!planName || !planPrice) {
      return new Response(
        JSON.stringify({ error: 'planName and planPrice are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Payload simplificado para Pagar.me (Sandbox)
    const pagarmePayload = {
      name: `TrustHBPO - ${planName}`,
      type: 'order',
      payment_settings: {
        accepted_payment_methods: ['credit_card', 'pix'],
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
            name: `Plano ${planName}`,
            description: `Assinatura mensal TrustHBPO`,
            amount: planPrice,
            default_quantity: 1
          }
        ]
      }
    }

    console.log('Sending to Pagar.me:', JSON.stringify(pagarmePayload, null, 2))

    // Autenticação Basic com a API key
    const authHeader = 'Basic ' + btoa(pagarmeApiKey + ':')

    const pagarmeResponse = await fetch('https://sdx-api.pagar.me/core/v5/paymentlinks', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(pagarmePayload)
    })

    const pagarmeData = await pagarmeResponse.json()

    console.log('Pagar.me response status:', pagarmeResponse.status)
    console.log('Pagar.me response:', JSON.stringify(pagarmeData, null, 2))

    if (!pagarmeResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment link', 
          details: pagarmeData 
        }),
        { status: pagarmeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retornar o link de pagamento
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
    console.error('Error creating payment link:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
