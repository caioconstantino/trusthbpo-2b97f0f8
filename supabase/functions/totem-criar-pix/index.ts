import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { totemSlug, cartItems, total, cpf } = body as {
      totemSlug: string;
      cartItems: Array<{ id: number; nome: string; preco: number; quantidade: number }>;
      total: number;
      cpf?: string;
    };

    if (!totemSlug || !cartItems?.length || !total) {
      return new Response(JSON.stringify({ error: "dados inválidos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: totem } = await supabase
      .from("tb_totens").select("*").eq("slug", totemSlug).eq("ativo", true).maybeSingle();
    if (!totem) {
      return new Response(JSON.stringify({ error: "totem não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = Math.round(Number(total) * 100);
    const pagarmeKey = Deno.env.get("PAGARME");
    if (!pagarmeKey) {
      return new Response(JSON.stringify({ error: "PAGARME not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderPayload = {
      items: cartItems.slice(0, 20).map((i) => ({
        amount: Math.round(i.preco * 100),
        description: (i.nome || "Produto").substring(0, 64),
        quantity: i.quantidade,
      })),
      customer: cpf
        ? { name: "Cliente Totem", type: "individual", document: cpf.replace(/\D/g, ""), email: "totem@trusthbpo.app" }
        : { name: "Cliente Totem", type: "individual", email: "totem@trusthbpo.app" },
      payments: [{ payment_method: "pix", pix: { expires_in: 600 } }],
      metadata: { origem: "totem", totem_id: totem.id, dominio: totem.dominio },
    };

    const credentials = btoa(`${pagarmeKey}:`);
    const resp = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        Accept: "application/json", "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error("pagarme error", data);
      return new Response(JSON.stringify({ error: "pagarme falhou", details: data }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const charge = data.charges?.[0];
    const lastTx = charge?.last_transaction;
    return new Response(
      JSON.stringify({
        order_id: data.id,
        charge_id: charge?.id,
        qr_code: lastTx?.qr_code,
        qr_code_url: lastTx?.qr_code_url,
        expires_at: lastTx?.expires_at,
        status: charge?.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});