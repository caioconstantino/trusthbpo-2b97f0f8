import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the webhook payload
    const payload = await req.json()
    
    console.log('Received Pagar.me webhook:', JSON.stringify(payload, null, 2))

    // Extract event type from payload
    const eventType = payload.type || payload.event || 'unknown'

    // Store the webhook in the database
    const { data: webhookData, error: webhookError } = await supabase
      .from('tb_webhooks')
      .insert({
        provider: 'pagarme',
        event_type: eventType,
        payload: payload,
        processed: false
      })
      .select()
      .single()

    if (webhookError) {
      console.error('Error storing webhook:', webhookError)
      return new Response(
        JSON.stringify({ error: 'Failed to store webhook', details: webhookError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Webhook stored successfully:', webhookData.id)

    // Process the webhook based on event type
    let processed = false
    let processResult = null

    // Handle different Pagar.me event types
    switch (eventType) {
      case 'charge.paid':
      case 'order.paid':
      case 'subscription.paid':
        // Payment was successful - activate license
        console.log('Payment confirmed, processing license activation...')
        
        // Extract customer/order info from payload
        const customerEmail = payload.data?.customer?.email
        const customerId = payload.data?.customer?.id
        const orderId = payload.data?.id || payload.data?.order?.id
        
        if (customerEmail) {
          // Update the SaaS customer status to active
          const { error: updateError } = await supabase
            .from('tb_clientes_saas')
            .update({ 
              status: 'Ativo',
              ultimo_pagamento: new Date().toISOString().split('T')[0],
              ultima_forma_pagamento: 'Pagar.me'
            })
            .eq('email', customerEmail)

          if (updateError) {
            console.error('Error updating customer:', updateError)
            processResult = { error: updateError.message }
          } else {
            console.log('Customer license activated for:', customerEmail)
            processResult = { activated: true, email: customerEmail }
            processed = true
          }
        } else {
          console.log('No customer email found in payload')
          processResult = { warning: 'No customer email in payload' }
        }
        break

      case 'charge.refunded':
      case 'subscription.canceled':
        // Payment refunded or subscription canceled - deactivate license
        console.log('Processing license deactivation...')
        
        const refundEmail = payload.data?.customer?.email
        if (refundEmail) {
          const { error: deactivateError } = await supabase
            .from('tb_clientes_saas')
            .update({ status: 'Suspenso' })
            .eq('email', refundEmail)

          if (deactivateError) {
            console.error('Error deactivating customer:', deactivateError)
            processResult = { error: deactivateError.message }
          } else {
            console.log('Customer license deactivated for:', refundEmail)
            processResult = { deactivated: true, email: refundEmail }
            processed = true
          }
        }
        break

      default:
        console.log('Unhandled event type:', eventType)
        processResult = { info: 'Event type not handled' }
    }

    // Update webhook as processed
    if (processed) {
      await supabase
        .from('tb_webhooks')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', webhookData.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhook_id: webhookData.id,
        event_type: eventType,
        processed,
        result: processResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
