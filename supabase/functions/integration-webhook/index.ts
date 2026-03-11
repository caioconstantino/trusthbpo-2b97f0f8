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
  // Expected payload: {
  //   cliente_nome?, sessao_id?, desconto_percentual?, acrescimo_percentual?,
  //   itens: [{ cod_interno, nome?, quantidade, preco_unitario }],
  //   pagamentos: [{ forma_pagamento: "Dinheiro"|"Crédito"|"Débito"|"Pix", valor }]
  // }
  if (!payload || !Array.isArray(payload.itens) || payload.itens.length === 0) {
    throw new Error("Payload inválido: envie { itens: [{ cod_interno, quantidade, preco_unitario }], pagamentos: [{ forma_pagamento, valor }] }");
  }

  // Resolve unidade_id: from integration, or find default for domain
  let unidadeId = integracao.unidade_id || null;
  if (!unidadeId) {
    const { data: unidade } = await supabase
      .from("tb_unidades")
      .select("id")
      .eq("dominio", integracao.dominio)
      .limit(1)
      .single();
    if (unidade) unidadeId = unidade.id;
  }

  // Use sessao_id from payload, or fall back to integration config
  const sessaoId = payload.sessao_id || (integracao.config?.sessao_id) || null;

  if (sessaoId) {
    const { data: sessao, error: sessaoError } = await supabase
      .from("tb_sessoes_caixa")
      .select("id, status")
      .eq("id", sessaoId)
      .eq("dominio", integracao.dominio)
      .single();

    if (sessaoError || !sessao) {
      throw new Error("Sessão de caixa (sessao_id) não encontrada para este domínio.");
    }
    if (sessao.status !== "aberto") {
      throw new Error("Sessão de caixa informada não está aberta.");
    }
  }

  // Resolve produtos by cod_interno (also accept produto_id as cod_interno fallback)
  const codigosInternos = payload.itens
    .map((item: any) => item.cod_interno || item.produto_id)
    .filter((v: any) => v && typeof v === "string");

  let produtosMap: Record<string, { id: number; nome: string }> = {};
  if (codigosInternos.length > 0) {
    const { data: produtos } = await supabase
      .from("tb_produtos")
      .select("id, nome, codigo")
      .eq("dominio", integracao.dominio)
      .in("codigo", codigosInternos);

    if (produtos) {
      for (const p of produtos) {
        if (p.codigo) produtosMap[p.codigo] = { id: p.id, nome: p.nome };
      }
    }
  }

  const frete = payload.frete || 0;

  // Add frete as a line item if > 0
  if (frete > 0) {
    payload.itens.push({
      nome: "Frete",
      quantidade: 1,
      preco_unitario: frete,
      cod_interno: null,
    });
  }

  const subtotal = payload.itens.reduce(
    (sum: number, item: any) => sum + (item.quantidade || 1) * (item.preco_unitario || 0),
    0
  );

  const descontoPerc = payload.desconto_percentual || 0;
  const acrescimoPerc = payload.acrescimo_percentual || 0;
  const descontoVal = (subtotal * descontoPerc) / 100;
  const acrescimoVal = (subtotal * acrescimoPerc) / 100;
  const total = subtotal - descontoVal + acrescimoVal;

  const totalPago = Array.isArray(payload.pagamentos)
    ? payload.pagamentos.reduce((s: number, p: any) => s + (p.valor || 0), 0)
    : total;
  const troco = Math.max(0, totalPago - total);

  const clienteNome = payload.cliente_nome || "Integração";
  const clienteDocumento = payload.cliente_documento || null;

  const { data: venda, error: vendaError } = await supabase
    .from("tb_vendas")
    .insert({
      dominio: integracao.dominio,
      unidade_id: unidadeId,
      sessao_id: sessaoId,
      cliente_nome: clienteDocumento ? `${clienteNome} (${clienteDocumento})` : clienteNome,
      subtotal,
      desconto_percentual: descontoPerc,
      acrescimo_percentual: acrescimoPerc,
      total,
      troco,
    })
    .select("id")
    .single();

  if (vendaError) throw new Error(`Erro ao criar venda: ${vendaError.message}`);

  // Insert items - resolve by cod_interno or produto_id (as cod_interno)
  const itensToInsert = payload.itens.map((item: any, idx: number) => {
    const codInterno = item.cod_interno || (typeof item.produto_id === "string" ? item.produto_id : null);
    const produtoRef = codInterno ? produtosMap[codInterno] : null;
    return {
      venda_id: venda.id,
      produto_nome: produtoRef?.nome || item.nome || `Item ${idx + 1}`,
      produto_id: produtoRef?.id || 0,
      quantidade: item.quantidade || 1,
      preco_unitario: item.preco_unitario || 0,
      total: (item.quantidade || 1) * (item.preco_unitario || 0),
    };
  });

  const { error: itensError } = await supabase
    .from("tb_vendas_itens")
    .insert(itensToInsert);

  if (itensError) throw new Error(`Erro ao criar itens da venda: ${itensError.message}`);

  // Insert payments
  if (Array.isArray(payload.pagamentos) && payload.pagamentos.length > 0) {
    const pagamentosToInsert = payload.pagamentos.map((p: any) => ({
      venda_id: venda.id,
      forma_pagamento: p.forma_pagamento || "Outros",
      valor: p.valor || 0,
    }));

    const { error: pagError } = await supabase
      .from("tb_vendas_pagamentos")
      .insert(pagamentosToInsert);

    if (pagError) throw new Error(`Erro ao registrar pagamentos: ${pagError.message}`);
  }

  return `Venda criada com ${payload.itens.length} iten(s), vinculada à sessão ${sessaoId || "nenhuma"}. Total: R$ ${total.toFixed(2)}`;
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
