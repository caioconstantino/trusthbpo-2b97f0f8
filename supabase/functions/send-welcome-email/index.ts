import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  email: string
  customerName: string
  dominio: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, customerName, dominio }: WelcomeEmailRequest = await req.json()

    if (!email || !customerName || !dominio) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, customerName, dominio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const createUserUrl = `https://trusthbpo.com/criar-usuario?dominio=${dominio}`

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
              <p>Sua conta foi criada com sucesso! Sua licença já está ativa e pronta para uso.</p>
              
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

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending welcome email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
