import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "slug required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: totem, error: tErr } = await supabase
      .from("tb_totens")
      .select("*")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle();
    if (tErr || !totem) {
      return new Response(JSON.stringify({ error: "Totem não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pq = supabase
      .from("tb_produtos")
      .select("id, nome, codigo, codigo_barras, preco_venda, imagem_url, categoria_id, ativo")
      .eq("dominio", totem.dominio)
      .eq("ativo", true);
    if (totem.unidade_id) pq = pq.or(`unidade_id.eq.${totem.unidade_id},unidade_id.is.null`);
    const { data: produtos } = await pq.order("nome");

    const { data: categorias } = await supabase
      .from("tb_categorias")
      .select("id, nome")
      .eq("dominio", totem.dominio)
      .order("nome");

    // Estoque por unidade
    let estoqueMap: Record<number, number> = {};
    if (totem.unidade_id && produtos?.length) {
      const ids = produtos.map((p) => p.id);
      const { data: estq } = await supabase
        .from("tb_estq_unidades")
        .select("produto_id, quantidade")
        .eq("dominio", totem.dominio)
        .eq("unidade_id", totem.unidade_id)
        .in("produto_id", ids);
      estoqueMap = Object.fromEntries((estq || []).map((e) => [e.produto_id, e.quantidade]));
    }

    return new Response(
      JSON.stringify({
        totem: {
          id: totem.id, nome: totem.nome, dominio: totem.dominio,
          unidade_id: totem.unidade_id, cor_primaria: totem.cor_primaria,
          logo_url: totem.logo_url, pix_ativo: totem.pix_ativo,
          cartao_confianca: totem.cartao_confianca,
        },
        produtos: (produtos || []).map((p) => ({ ...p, estoque: estoqueMap[p.id] ?? null })),
        categorias: categorias || [],
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