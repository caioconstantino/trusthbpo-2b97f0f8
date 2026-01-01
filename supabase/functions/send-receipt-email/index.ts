import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  customerName?: string;
  total?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, customerName, total }: EmailRequest = await req.json();

    console.log(`Sending receipt email to: ${to}`);

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST") || "",
        port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER") || "",
          password: Deno.env.get("SMTP_PASSWORD") || "",
        },
      },
    });

    const emailSubject = subject || `Comprovante de Venda${total ? ` - R$ ${total.toFixed(2)}` : ''}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .receipt { background: white; padding: 20px; border-radius: 8px; margin-top: 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Comprovante de Venda</h1>
          </div>
          <div class="content">
            <p>Olá${customerName ? ` ${customerName}` : ''},</p>
            <p>Segue abaixo o comprovante da sua compra:</p>
            <div class="receipt">
              ${html}
            </div>
          </div>
          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await client.send({
      from: Deno.env.get("SMTP_FROM_EMAIL") || "noreply@trusthbpo.com",
      to: to,
      subject: emailSubject,
      content: "Seu comprovante de venda",
      html: emailHtml,
    });

    await client.close();

    console.log(`Receipt email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error sending receipt email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
