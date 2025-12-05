import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature',
}

interface PagarmeCustomer {
  id: string
  name: string
  email: string
  document: string
  type: string
}

interface PagarmeOrderItem {
  id: string
  description: string
  amount: number
  quantity: number
}

interface PagarmeWebhookPayload {
  id: string
  type: string
  created_at: string
  data: {
    id: string
    code: string
    amount: number
    status: string
    customer: PagarmeCustomer
    items?: PagarmeOrderItem[]
    metadata?: {
      cupom?: string
      revenda_id?: string
      dominio?: string
      tipo?: string
      quantidade?: number
    }
  }
}

// Generate a unique domain from customer name
function generateDomain(name: string): string {
  const baseDomain = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .substring(0, 20)
  
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${baseDomain}${randomSuffix}`
}

// Calculate next payment date (30 days from now)
function getNextPaymentDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

// Get plan name from amount (in cents)
function getPlanFromAmount(amount: number): string {
  if (amount === 3990) return 'Básico'
  if (amount === 9990) return 'Profissional'
  return 'Personalizado'
}

// Send email via SMTP
async function sendWelcomeEmail(
  email: string, 
  customerName: string, 
  dominio: string
): Promise<boolean> {
  try {
    const smtpHost = Deno.env.get('SMTP_HOST')!
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')!
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')!
    const smtpFrom = Deno.env.get('SMTP_FROM_EMAIL')!

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    })

    const createUserUrl = `https://trusthbpo.lovable.app/criar-usuario?dominio=${dominio}`

    await client.send({
      from: smtpFrom,
      to: email,
      subject: 'Bem-vindo ao TrustHBPO - Crie seu usuário',
      content: 'auto',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao TrustHBPO!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${customerName}</strong>,</p>
              <p>Seu pagamento foi confirmado com sucesso! Sua licença já está ativa e pronta para uso.</p>
              
              <div class="info-box">
                <p><strong>Seu domínio de acesso:</strong> ${dominio}</p>
                <p>Guarde esta informação, você precisará dela para fazer login no sistema.</p>
              </div>
              
              <p>Para começar a usar o sistema, você precisa criar seu usuário de acesso:</p>
              
              <p style="text-align: center;">
                <a href="${createUserUrl}" class="button">Criar Meu Usuário</a>
              </p>
              
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #2563eb;">${createUserUrl}</p>
              
              <p>Se tiver dúvidas, entre em contato conosco!</p>
              
              <p>Atenciosamente,<br><strong>Equipe TrustHBPO</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    await client.close()
    console.log('Welcome email sent successfully to:', email)
    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}

// Send renewal confirmation email
async function sendRenewalEmail(
  email: string, 
  customerName: string, 
  dominio: string,
  nextPaymentDate: string
): Promise<boolean> {
  try {
    const smtpHost = Deno.env.get('SMTP_HOST')!
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')!
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')!
    const smtpFrom = Deno.env.get('SMTP_FROM_EMAIL')!

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    })

    const formattedDate = new Date(nextPaymentDate).toLocaleDateString('pt-BR')

    await client.send({
      from: smtpFrom,
      to: email,
      subject: 'Pagamento Confirmado - TrustHBPO',
      content: 'auto',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pagamento Confirmado!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${customerName}</strong>,</p>
              <p>Seu pagamento foi processado com sucesso e sua licença foi renovada!</p>
              
              <div class="info-box">
                <p><strong>Domínio:</strong> ${dominio}</p>
                <p><strong>Status:</strong> Ativo</p>
                <p><strong>Próximo vencimento:</strong> ${formattedDate}</p>
              </div>
              
              <p>Continue aproveitando todos os recursos do TrustHBPO!</p>
              
              <p>Atenciosamente,<br><strong>Equipe TrustHBPO</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    await client.close()
    console.log('Renewal email sent successfully to:', email)
    return true
  } catch (error) {
    console.error('Error sending renewal email:', error)
    return false
  }
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
    const payload: PagarmeWebhookPayload = await req.json()
    
    console.log('Received Pagar.me webhook:', JSON.stringify(payload, null, 2))

    // Extract event type from payload
    const eventType = payload.type || 'unknown'

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
    let processResult: Record<string, unknown> = {}

    // Handle order.paid event
    if (eventType === 'order.paid') {
      console.log('Processing order.paid event...')
      
      const customer = payload.data?.customer
      const metadata = payload.data?.metadata
      const cupom = metadata?.cupom || null
      const revendaId = metadata?.revenda_id || null
      const metaDominio = metadata?.dominio || null
      const tipo = metadata?.tipo || 'plano'
      const quantidade = metadata?.quantidade || 1
      
      console.log('Metadata:', { cupom, revendaId, metaDominio, tipo, quantidade })
      
      // Handle addon purchases (PDV or Empresa adicional)
      if (tipo === 'pdv_adicional' || tipo === 'empresa_adicional') {
        console.log(`Processing ${tipo} purchase for domain:`, metaDominio)
        
        if (!metaDominio) {
          console.error('No domain provided for addon purchase')
          processResult = { error: 'No domain provided for addon purchase' }
        } else {
          // Find customer by domain
          const { data: customerData, error: findError } = await supabase
            .from('tb_clientes_saas')
            .select('id, pdvs_adicionais, empresas_adicionais, razao_social, email')
            .eq('dominio', metaDominio)
            .single()
          
          if (findError || !customerData) {
            console.error('Customer not found for domain:', metaDominio)
            processResult = { error: `Customer not found for domain: ${metaDominio}` }
          } else {
            // Update the appropriate addon count
            const updateData: Record<string, number> = {}
            if (tipo === 'pdv_adicional') {
              updateData.pdvs_adicionais = (customerData.pdvs_adicionais || 0) + quantidade
            } else {
              updateData.empresas_adicionais = (customerData.empresas_adicionais || 0) + quantidade
            }
            
            const { error: updateError } = await supabase
              .from('tb_clientes_saas')
              .update(updateData)
              .eq('id', customerData.id)
            
            if (updateError) {
              console.error('Error updating addon count:', updateError)
              processResult = { error: updateError.message }
            } else {
              console.log(`${tipo} updated for ${metaDominio}:`, updateData)
              processResult = {
                action: 'addon_purchased',
                tipo,
                quantidade,
                dominio: metaDominio,
                new_count: tipo === 'pdv_adicional' ? updateData.pdvs_adicionais : updateData.empresas_adicionais
              }
              processed = true
            }
          }
        }
      }
      // Handle regular plan purchases
      else if (!customer) {
        console.log('No customer data in payload')
        processResult = { warning: 'No customer data in payload' }
      } else {
        const customerEmail = customer.email
        const customerDocument = customer.document
        const customerName = customer.name
        const orderAmount = payload.data?.amount || 0
        const plan = getPlanFromAmount(orderAmount)

        console.log('Customer info:', { email: customerEmail, document: customerDocument, name: customerName })

        // Check if customer already exists (by email or document)
        const { data: existingCustomer, error: searchError } = await supabase
          .from('tb_clientes_saas')
          .select('*')
          .or(`email.eq.${customerEmail},cpf_cnpj.eq.${customerDocument}`)
          .maybeSingle()

        if (searchError) {
          console.error('Error searching for customer:', searchError)
          processResult = { error: searchError.message }
        } else if (existingCustomer) {
          // Customer exists - renew license
          console.log('Existing customer found, renewing license:', existingCustomer.dominio)
          
          const today = new Date().toISOString().split('T')[0]
          const nextPayment = getNextPaymentDate()

          const { error: updateError } = await supabase
            .from('tb_clientes_saas')
            .update({
              status: 'Ativo',
              ultimo_pagamento: today,
              proximo_pagamento: nextPayment,
              ultima_forma_pagamento: 'Pagar.me',
              plano: plan
            })
            .eq('id', existingCustomer.id)

          if (updateError) {
            console.error('Error updating customer:', updateError)
            processResult = { error: updateError.message }
          } else {
            console.log('License renewed for:', customerEmail)
            
            // Send renewal confirmation email
            await sendRenewalEmail(
              customerEmail, 
              existingCustomer.razao_social || customerName,
              existingCustomer.dominio,
              nextPayment
            )
            
            processResult = { 
              action: 'renewed', 
              email: customerEmail, 
              dominio: existingCustomer.dominio,
              next_payment: nextPayment
            }
            processed = true
          }
        } else {
          // New customer - create account and activate license
          console.log('New customer, creating account...')
          
          const newDominio = generateDomain(customerName)
          const today = new Date().toISOString().split('T')[0]
          const nextPayment = getNextPaymentDate()

          const { data: newCustomer, error: insertError } = await supabase
            .from('tb_clientes_saas')
            .insert({
              razao_social: customerName,
              email: customerEmail,
              cpf_cnpj: customerDocument,
              dominio: newDominio,
              status: 'Ativo',
              plano: plan,
              ultimo_pagamento: today,
              proximo_pagamento: nextPayment,
              ultima_forma_pagamento: 'Pagar.me',
              cupom: cupom // Link customer to reseller via cupom
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating customer:', insertError)
            processResult = { error: insertError.message }
          } else {
            console.log('New customer created:', newDominio)
            
            // Create default "Matriz" unit for the new customer
            const { error: unidadeError } = await supabase
              .from('tb_unidades')
              .insert({
                dominio: newDominio,
                nome: 'Matriz',
                ativo: true
              })
            
            if (unidadeError) {
              console.error('Error creating Matriz unit:', unidadeError)
            } else {
              console.log('Matriz unit created for:', newDominio)
            }
            
            // If this sale came from a reseller, create a sale record
            if (revendaId) {
              console.log('Creating reseller sale record...')
              
              // Get reseller product info to calculate profit
              const { data: revendaProduto } = await supabase
                .from('tb_revendas_produtos')
                .select('*')
                .eq('revenda_id', revendaId)
                .single()
              
              const valorVenda = orderAmount / 100 // Convert from cents
              const precoOriginal = revendaProduto?.preco_original || valorVenda
              const lucro = valorVenda - precoOriginal
              
              const { error: vendaError } = await supabase
                .from('tb_revendas_vendas')
                .insert({
                  revenda_id: revendaId,
                  cliente_nome: customerName,
                  cliente_email: customerEmail,
                  cliente_dominio: newDominio,
                  produto_codigo: plan.toLowerCase().replace('á', 'a'),
                  produto_nome: plan,
                  valor_venda: valorVenda,
                  valor_original: precoOriginal,
                  lucro: lucro > 0 ? lucro : 0,
                  status: 'pago',
                  data_pagamento: new Date().toISOString()
                })
              
              if (vendaError) {
                console.error('Error creating reseller sale:', vendaError)
              } else {
                console.log('Reseller sale record created')
                
                // Update reseller balance - fetch current and increment
                const { data: revendaData } = await supabase
                  .from('tb_revendas')
                  .select('saldo, total_ganho')
                  .eq('id', revendaId)
                  .single()
                
                if (revendaData && lucro > 0) {
                  const { error: balanceError } = await supabase
                    .from('tb_revendas')
                    .update({
                      saldo: (revendaData.saldo || 0) + lucro,
                      total_ganho: (revendaData.total_ganho || 0) + lucro
                    })
                    .eq('id', revendaId)
                  
                  if (balanceError) {
                    console.error('Error updating reseller balance:', balanceError)
                  } else {
                    console.log('Reseller balance updated:', { lucro })
                  }
                }
              }
            }
            
            // Send welcome email with link to create user
            await sendWelcomeEmail(customerEmail, customerName, newDominio)
            
            processResult = { 
              action: 'created', 
              email: customerEmail, 
              dominio: newDominio,
              customer_id: newCustomer.id,
              cupom: cupom,
              revenda_id: revendaId
            }
            processed = true
          }
        }
      }
    }
    // Handle refund/cancellation
    else if (eventType === 'charge.refunded' || eventType === 'subscription.canceled') {
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
          processResult = { action: 'deactivated', email: refundEmail }
          processed = true
        }
      }
    } else {
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
