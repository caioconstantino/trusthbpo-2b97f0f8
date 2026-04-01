import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dominio = url.searchParams.get("dominio");

    if (!dominio) {
      return new Response(JSON.stringify({ error: "dominio is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get company info
    const { data: cliente } = await supabase
      .from("tb_clientes_saas")
      .select("razao_social, dominio")
      .eq("dominio", dominio)
      .eq("status", "Ativo")
      .single();

    if (!cliente) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active products with stock
    const { data: produtos, error } = await supabase
      .from("tb_produtos")
      .select("id, nome, preco_venda, imagem_url, codigo")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (error) throw error;

    // Get stock for these products
    const productIds = (produtos || []).map((p: any) => p.id);
    const { data: estoque } = await supabase
      .from("tb_estq_unidades")
      .select("produto_id, quantidade")
      .eq("dominio", dominio)
      .in("produto_id", productIds.length > 0 ? productIds : [0]);

    // Merge stock into products
    const stockMap: Record<number, number> = {};
    (estoque || []).forEach((e: any) => {
      stockMap[e.produto_id] = (stockMap[e.produto_id] || 0) + e.quantidade;
    });

    const result = (produtos || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      preco_venda: p.preco_venda,
      imagem_url: p.imagem_url,
      quantidade: stockMap[p.id] || 0,
    }));

    return new Response(
      JSON.stringify({ empresa: cliente.razao_social, produtos: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
