import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      totemSlug, cartItems, total, cpf, formaPagamento,
      transactionIdExterno, qrCode, qrCodeUrl,
    } = body as {
      totemSlug: string;
      cartItems: Array<{ id: number; nome: string; preco: number; quantidade: number }>;
      total: number;
      cpf?: string;
      formaPagamento: "pix" | "cartao_maquininha";
      transactionIdExterno?: string;
      qrCode?: string;
      qrCodeUrl?: string;
    };

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

    const { data: venda, error: vErr } = await supabase
      .from("tb_vendas")
      .insert({
        dominio: totem.dominio,
        unidade_id: totem.unidade_id,
        origem: "totem",
        totem_id: totem.id,
        cpf_cliente: cpf || null,
        cliente_nome: cpf ? `CPF ${cpf}` : "Totem",
        subtotal: total,
        desconto_percentual: 0,
        acrescimo_percentual: 0,
        total,
        troco: 0,
      })
      .select().single();
    if (vErr) throw vErr;

    await supabase.from("tb_vendas_itens").insert(
      cartItems.map((i) => ({
        venda_id: venda.id, produto_id: i.id, produto_nome: i.nome,
        quantidade: i.quantidade, preco_unitario: i.preco, total: i.preco * i.quantidade,
      })),
    );

    await supabase.from("tb_vendas_pagamentos").insert({
      venda_id: venda.id,
      forma_pagamento: formaPagamento,
      valor: total,
      status: "pago",
      transaction_id_externo: transactionIdExterno || null,
      qr_code: qrCode || null,
      qr_code_url: qrCodeUrl || null,
    });

    // Baixa estoque
    const effectiveUnidadeId = totem.unidade_id || 1;
    for (const item of cartItems) {
      const { data: existing } = await supabase
        .from("tb_estq_unidades")
        .select("id, quantidade")
        .eq("produto_id", item.id)
        .eq("dominio", totem.dominio)
        .eq("unidade_id", effectiveUnidadeId)
        .maybeSingle();
      if (existing) {
        await supabase.from("tb_estq_unidades")
          .update({ quantidade: existing.quantidade - item.quantidade })
          .eq("id", existing.id);
      }
    }

    return new Response(JSON.stringify({ success: true, vendaId: venda.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});