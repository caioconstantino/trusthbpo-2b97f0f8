import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductInput {
  id?: number;
  codigo?: string | null;
  nome?: string | null;
  preco?: number | null;
  preco_venda?: number | null;
  preco_compra?: number | null;
  preco_custo?: number | null;
  estoque?: number | null;
  categoria?: string | null;
  categoria_id?: number | null;
  imagem?: string | null;
  imagem_url?: string | null;
  codigo_barras?: string | null;
  action?: "delete";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    dominio?: string;
    unidade_id?: number | null;
    produtos?: ProductInput[];
    action?: "upsert" | "delete";
    integracao_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { dominio, unidade_id, integracao_id } = body;
  const action = body.action || "upsert";
  if (!dominio) {
    return new Response(JSON.stringify({ error: "dominio é obrigatório" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch active integrations of type enviar_produtos
  let query = supabase
    .from("tb_integracoes")
    .select("*")
    .eq("dominio", dominio)
    .eq("tipo", "enviar_produtos")
    .eq("ativo", true);
  if (integracao_id) query = query.eq("id", integracao_id);

  const { data: integracoes, error: intError } = await query;
  if (intError || !integracoes || integracoes.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: "Nenhuma integração ativa do tipo enviar_produtos." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Resolve product list - if not provided, fetch all active for domain/unit
  let produtos: ProductInput[] = body.produtos || [];
  if (!produtos || produtos.length === 0) {
    let q = supabase
      .from("tb_produtos")
      .select("id, codigo, nome, preco_venda, preco_custo, categoria_id, imagem_url, codigo_barras")
      .eq("dominio", dominio)
      .eq("ativo", true);
    if (unidade_id) q = q.eq("unidade_id", unidade_id);
    const { data } = await q;
    produtos = (data || []) as ProductInput[];
  }

  if (!produtos || produtos.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, message: "Sem produtos para enviar" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve categories (id -> name) and stock per product if missing
  const categoriaIds = Array.from(
    new Set(produtos.map((p) => p.categoria_id).filter((v): v is number => !!v)),
  );
  const categoriasMap: Record<number, string> = {};
  if (categoriaIds.length > 0) {
    const { data: cats } = await supabase
      .from("tb_categorias")
      .select("id, nome")
      .in("id", categoriaIds);
    for (const c of cats || []) categoriasMap[c.id] = c.nome;
  }

  // Stock lookup (only for upsert and only when not provided)
  const productIds = produtos.map((p) => p.id).filter((v): v is number => !!v);
  const stockMap: Record<number, number> = {};
  if (action === "upsert" && productIds.length > 0) {
    let sq = supabase
      .from("tb_estq_unidades")
      .select("produto_id, quantidade")
      .in("produto_id", productIds)
      .eq("dominio", dominio);
    if (unidade_id) sq = sq.eq("unidade_id", unidade_id);
    const { data: estoques } = await sq;
    for (const e of estoques || []) {
      stockMap[e.produto_id] = (stockMap[e.produto_id] || 0) + (e.quantidade || 0);
    }
  }

  // Build ERP payload
  const erpProdutos = produtos
    .map((p) => {
      const codigo = p.codigo;
      if (!codigo) return null;
      if (action === "delete" || p.action === "delete") {
        return { codigo, action: "delete" };
      }
      const item: Record<string, unknown> = { codigo };
      if (p.nome != null) item.nome = p.nome;
      const preco = p.preco ?? p.preco_venda;
      if (preco != null) item.preco = preco;
      const precoCompra = p.preco_compra ?? p.preco_custo;
      if (precoCompra != null) item.preco_compra = precoCompra;
      const estoque = p.estoque ?? (p.id ? stockMap[p.id] : undefined);
      if (estoque != null) item.estoque = estoque;
      const categoria = p.categoria ?? (p.categoria_id ? categoriasMap[p.categoria_id] : undefined);
      if (categoria) item.categoria = categoria;
      const imagem = p.imagem ?? p.imagem_url;
      if (imagem) item.imagem = imagem;
      if (p.codigo_barras) item.codigo_barras = p.codigo_barras;
      return item;
    })
    .filter((v) => v !== null);

  if (erpProdutos.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: "Nenhum produto possui código (sku) para envio." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const results: Array<{ integracao_id: string; status: string; resposta: string }> = [];

  for (const integracao of integracoes) {
    const config = (integracao.config as Record<string, unknown>) || {};
    const endpointUrl = config.endpoint_url as string | undefined;
    const apikey = config.apikey as string | undefined;
    if (!endpointUrl || !apikey) {
      const resposta = "Integração sem endpoint_url ou apikey configurados.";
      await supabase.from("tb_integracoes_logs").insert({
        integracao_id: integracao.id,
        status: "erro",
        payload: { produtos: erpProdutos },
        resposta,
      });
      results.push({ integracao_id: integracao.id, status: "erro", resposta });
      continue;
    }

    let status = "sucesso";
    let resposta = "";
    try {
      const resp = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apikey,
        },
        body: JSON.stringify({ produtos: erpProdutos }),
      });
      const text = await resp.text();
      resposta = `HTTP ${resp.status}: ${text.slice(0, 800)}`;
      if (!resp.ok && resp.status !== 207) status = "erro";
    } catch (err) {
      status = "erro";
      resposta = err instanceof Error ? err.message : "Erro desconhecido";
    }

    await supabase.from("tb_integracoes_logs").insert({
      integracao_id: integracao.id,
      status,
      payload: { produtos: erpProdutos, action },
      resposta,
    });
    results.push({ integracao_id: integracao.id, status, resposta });
  }

  return new Response(
    JSON.stringify({ ok: true, sent: erpProdutos.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});