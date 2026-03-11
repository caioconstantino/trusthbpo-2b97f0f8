import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-integration-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = req.headers.get("x-integration-token");
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Token de integração não fornecido. Envie no header X-Integration-Token." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Validate token
    const { data: integracao, error: intError } = await supabase
      .from("tb_integracoes")
      .select("*")
      .eq("webhook_token", token)
      .eq("ativo", true)
      .single();

    if (intError || !integracao) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou integração inativa." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Payload JSON inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resposta = "Webhook recebido com sucesso.";
    let status = "sucesso";

    try {
      // Process based on integration type
      if (integracao.tipo === "receber_vendas") {
        resposta = await processarVendas(supabase, integracao, payload);
      } else if (integracao.tipo === "receber_produtos") {
        resposta = await processarProdutos(supabase, integracao, payload);
      } else {
        // webhook_personalizado - just log
        resposta = "Webhook genérico recebido e registrado.";
      }
    } catch (processError: unknown) {
      status = "erro";
      resposta = processError instanceof Error ? processError.message : "Erro ao processar payload.";
    }

    // Log the call
    await supabase.from("tb_integracoes_logs").insert({
      integracao_id: integracao.id,
      status,
      payload,
      resposta,
    });

    const httpStatus = status === "sucesso" ? 200 : 422;
    return new Response(
      JSON.stringify({ status, mensagem: resposta }),
      { status: httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Integration webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno.";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processarVendas(supabase: any, integracao: any, payload: any) {
  // Expected payload: { cliente_nome?, itens: [{ nome, quantidade, preco_unitario }], forma_pagamento?, observacoes? }
  if (!payload || !Array.isArray(payload.itens) || payload.itens.length === 0) {
    throw new Error("Payload inválido: envie { itens: [{ nome, quantidade, preco_unitario }] }");
  }

  const total = payload.itens.reduce(
    (sum: number, item: any) => sum + (item.quantidade || 1) * (item.preco_unitario || 0),
    0
  );

  const { data: venda, error: vendaError } = await supabase
    .from("tb_vendas")
    .insert({
      dominio: integracao.dominio,
      unidade_id: integracao.unidade_id,
      cliente_nome: payload.cliente_nome || "Integração",
      forma_pagamento: payload.forma_pagamento || "Outros",
      total,
      observacoes: payload.observacoes || `Via integração: ${integracao.nome}`,
      status: "concluida",
      origem: "integracao",
    })
    .select("id")
    .single();

  if (vendaError) throw new Error(`Erro ao criar venda: ${vendaError.message}`);

  const itensToInsert = payload.itens.map((item: any, idx: number) => ({
    venda_id: venda.id,
    produto_nome: item.nome || `Item ${idx + 1}`,
    quantidade: item.quantidade || 1,
    preco_unitario: item.preco_unitario || 0,
    total: (item.quantidade || 1) * (item.preco_unitario || 0),
  }));

  const { error: itensError } = await supabase
    .from("tb_vendas_itens")
    .insert(itensToInsert);

  if (itensError) throw new Error(`Erro ao criar itens da venda: ${itensError.message}`);

  return `Venda criada com ${payload.itens.length} iten(s). Total: R$ ${total.toFixed(2)}`;
}

async function processarProdutos(supabase: any, integracao: any, payload: any) {
  // Expected payload: { produtos: [{ nome, preco_venda?, preco_custo?, codigo? }] }
  if (!payload || !Array.isArray(payload.produtos) || payload.produtos.length === 0) {
    throw new Error("Payload inválido: envie { produtos: [{ nome, preco_venda?, preco_custo? }] }");
  }

  const produtosToInsert = payload.produtos.map((p: any) => ({
    dominio: integracao.dominio,
    unidade_id: integracao.unidade_id,
    nome: p.nome,
    preco_venda: p.preco_venda || 0,
    preco_custo: p.preco_custo || 0,
    codigo: p.codigo || null,
    ativo: true,
  }));

  const { error } = await supabase
    .from("tb_produtos")
    .insert(produtosToInsert);

  if (error) throw new Error(`Erro ao inserir produtos: ${error.message}`);

  return `${payload.produtos.length} produto(s) importado(s) com sucesso.`;
}
