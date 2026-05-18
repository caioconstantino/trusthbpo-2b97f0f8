const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pagarmeKey = Deno.env.get("PAGARME")!;
    const credentials = btoa(`${pagarmeKey}:`);
    const resp = await fetch(`https://api.pagar.me/core/v5/orders/${orderId}`, {
      headers: { Authorization: `Basic ${credentials}`, Accept: "application/json" },
    });
    const data = await resp.json();
    const charge = data.charges?.[0];
    return new Response(
      JSON.stringify({ status: charge?.status || data.status, paid: charge?.status === "paid" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});