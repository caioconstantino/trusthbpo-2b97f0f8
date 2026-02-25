import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { dominio, razao_social, email } = await req.json()

    if (!dominio || !razao_social) {
      return new Response(JSON.stringify({ error: 'Domínio e Razão Social são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const domainLower = dominio.toLowerCase().trim()

    // Check if domain already exists
    const { data: existing } = await supabaseAdmin
      .from('tb_clientes_saas')
      .select('id')
      .eq('dominio', domainLower)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Este domínio já está em uso' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Create SaaS client
    const proximoPagamento = new Date()
    proximoPagamento.setDate(proximoPagamento.getDate() + 30)

    const { error: clienteError } = await supabaseAdmin.from('tb_clientes_saas').insert({
      dominio: domainLower,
      razao_social,
      email: email || null,
      status: 'Ativo',
      plano: 'Profissional',
      proximo_pagamento: proximoPagamento.toISOString().split('T')[0],
      ultimo_pagamento: new Date().toISOString().split('T')[0],
      observacoes: '⭐ Conta de demonstração criada automaticamente com dados de exemplo.',
    })

    if (clienteError) throw clienteError

    // 2. Create Matriz unit
    const { data: unidadeData, error: unidadeError } = await supabaseAdmin
      .from('tb_unidades')
      .insert({ dominio: domainLower, nome: 'Matriz' })
      .select('id')
      .single()

    if (unidadeError) throw unidadeError
    const unidadeId = unidadeData.id

    // 3. Create Administradores group with full permissions
    const { data: grupoData, error: grupoError } = await supabaseAdmin
      .from('tb_grupos_permissao')
      .insert({
        dominio: domainLower,
        nome: 'Administradores',
        descricao: 'Grupo com acesso total ao sistema',
      })
      .select('id')
      .single()

    if (grupoError) throw grupoError

    const modulos = [
      'dashboard', 'pdv', 'produtos', 'clientes', 'compras',
      'contas_pagar', 'contas_receber', 'central_contas', 'configuracoes', 'agenda',
    ]

    await supabaseAdmin.from('tb_grupos_permissao_modulos').insert(
      modulos.map((modulo) => ({
        grupo_id: grupoData.id,
        modulo,
        visualizar: true,
        editar: true,
        excluir: true,
      }))
    )

    // 4. Create demo categories
    const categoriasNomes = ['Bebidas', 'Alimentos', 'Limpeza', 'Higiene', 'Diversos']
    const { data: categorias } = await supabaseAdmin
      .from('tb_categorias')
      .insert(categoriasNomes.map(nome => ({ dominio: domainLower, nome, unidade_id: unidadeId })))
      .select('id, nome')

    const catMap: Record<string, number> = {}
    categorias?.forEach(c => { catMap[c.nome] = c.id })

    // 5. Create demo products
    const demoProdutos = [
      { nome: 'Coca-Cola 350ml', preco_venda: 5.50, preco_custo: 3.20, categoria: 'Bebidas', codigo: 'BEB001', tipo: 'produto' },
      { nome: 'Guaraná Antarctica 2L', preco_venda: 8.90, preco_custo: 5.50, categoria: 'Bebidas', codigo: 'BEB002', tipo: 'produto' },
      { nome: 'Água Mineral 500ml', preco_venda: 3.00, preco_custo: 1.20, categoria: 'Bebidas', codigo: 'BEB003', tipo: 'produto' },
      { nome: 'Suco de Laranja 1L', preco_venda: 7.90, preco_custo: 4.50, categoria: 'Bebidas', codigo: 'BEB004', tipo: 'produto' },
      { nome: 'Cerveja Lata 350ml', preco_venda: 4.50, preco_custo: 2.80, categoria: 'Bebidas', codigo: 'BEB005', tipo: 'produto' },
      { nome: 'Pão de Forma', preco_venda: 8.50, preco_custo: 5.00, categoria: 'Alimentos', codigo: 'ALI001', tipo: 'produto' },
      { nome: 'Arroz 5kg', preco_venda: 22.90, preco_custo: 16.00, categoria: 'Alimentos', codigo: 'ALI002', tipo: 'produto' },
      { nome: 'Feijão Preto 1kg', preco_venda: 8.90, preco_custo: 5.50, categoria: 'Alimentos', codigo: 'ALI003', tipo: 'produto' },
      { nome: 'Macarrão Espaguete 500g', preco_venda: 4.90, preco_custo: 2.80, categoria: 'Alimentos', codigo: 'ALI004', tipo: 'produto' },
      { nome: 'Óleo de Soja 900ml', preco_venda: 7.90, preco_custo: 5.20, categoria: 'Alimentos', codigo: 'ALI005', tipo: 'produto' },
      { nome: 'Detergente 500ml', preco_venda: 2.90, preco_custo: 1.50, categoria: 'Limpeza', codigo: 'LIM001', tipo: 'produto' },
      { nome: 'Desinfetante 2L', preco_venda: 6.90, preco_custo: 3.80, categoria: 'Limpeza', codigo: 'LIM002', tipo: 'produto' },
      { nome: 'Sabão em Pó 1kg', preco_venda: 12.90, preco_custo: 8.50, categoria: 'Limpeza', codigo: 'LIM003', tipo: 'produto' },
      { nome: 'Sabonete', preco_venda: 2.50, preco_custo: 1.20, categoria: 'Higiene', codigo: 'HIG001', tipo: 'produto' },
      { nome: 'Shampoo 350ml', preco_venda: 14.90, preco_custo: 8.50, categoria: 'Higiene', codigo: 'HIG002', tipo: 'produto' },
      { nome: 'Papel Higiênico 12un', preco_venda: 15.90, preco_custo: 10.00, categoria: 'Higiene', codigo: 'HIG003', tipo: 'produto' },
      { nome: 'Pilha AA 4un', preco_venda: 12.90, preco_custo: 7.00, categoria: 'Diversos', codigo: 'DIV001', tipo: 'produto' },
      { nome: 'Fita Adesiva', preco_venda: 4.50, preco_custo: 2.00, categoria: 'Diversos', codigo: 'DIV002', tipo: 'produto' },
      { nome: 'Corte de Cabelo', preco_venda: 35.00, preco_custo: 0, categoria: 'Diversos', codigo: 'SRV001', tipo: 'servico' },
      { nome: 'Manutenção Geral', preco_venda: 80.00, preco_custo: 0, categoria: 'Diversos', codigo: 'SRV002', tipo: 'servico' },
    ]

    const { data: produtos } = await supabaseAdmin
      .from('tb_produtos')
      .insert(
        demoProdutos.map(p => ({
          dominio: domainLower,
          nome: p.nome,
          preco_venda: p.preco_venda,
          preco_custo: p.preco_custo,
          categoria_id: catMap[p.categoria] || null,
          codigo: p.codigo,
          tipo: p.tipo,
          ativo: true,
          unidade_id: unidadeId,
        }))
      )
      .select('id')

    // 6. Create stock for products
    if (produtos && produtos.length > 0) {
      await supabaseAdmin.from('tb_estq_unidades').insert(
        produtos.map(p => ({
          dominio: domainLower,
          produto_id: p.id,
          unidade_id: unidadeId,
          quantidade: Math.floor(Math.random() * 80) + 20,
          quantidade_minima: 5,
        }))
      )
    }

    // 7. Create demo customers
    const demoClientes = [
      { razao_social: 'Maria Silva', cpf_cnpj: '123.456.789-00', email: 'maria@email.com', telefone: '(11) 99999-0001', status: 'Ativo' },
      { razao_social: 'João Santos', cpf_cnpj: '987.654.321-00', email: 'joao@email.com', telefone: '(11) 99999-0002', status: 'Ativo' },
      { razao_social: 'Ana Oliveira', cpf_cnpj: '456.789.123-00', email: 'ana@email.com', telefone: '(11) 99999-0003', status: 'Ativo' },
      { razao_social: 'Carlos Pereira', cpf_cnpj: '321.654.987-00', email: 'carlos@email.com', telefone: '(11) 99999-0004', status: 'Lead' },
      { razao_social: 'Empresa ABC Ltda', cpf_cnpj: '12.345.678/0001-90', email: 'contato@abc.com', telefone: '(11) 3333-0001', status: 'Ativo' },
      { razao_social: 'Tech Solutions ME', cpf_cnpj: '98.765.432/0001-10', email: 'contato@tech.com', telefone: '(11) 3333-0002', status: 'Lead' },
    ]

    await supabaseAdmin.from('tb_clientes').insert(
      demoClientes.map(c => ({
        dominio: domainLower,
        razao_social: c.razao_social,
        cpf_cnpj: c.cpf_cnpj,
        email: c.email,
        telefone: c.telefone,
        status: c.status,
        observacoes: 'Cliente de demonstração',
        responsavel: '',
        unidade_id: unidadeId,
      }))
    )

    // 8. Create demo contas a pagar
    const hoje = new Date()
    const demoContasPagar = [
      { descricao: 'Aluguel do mês', valor: 2500, vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 10), fornecedor: 'Imobiliária Central', categoria: 'Aluguel' },
      { descricao: 'Conta de Energia', valor: 450, vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 15), fornecedor: 'Companhia Elétrica', categoria: 'Utilidades' },
      { descricao: 'Internet', valor: 199.90, vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 20), fornecedor: 'Provedor Net', categoria: 'Utilidades' },
      { descricao: 'Fornecedor de Bebidas', valor: 1200, vencimento: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 5), fornecedor: 'Distribuidora Bebidas', categoria: 'Fornecedores', status: 'pendente' },
    ]

    await supabaseAdmin.from('tb_contas_pagar').insert(
      demoContasPagar.map(c => ({
        dominio: domainLower,
        descricao: c.descricao,
        valor: c.valor,
        vencimento: c.vencimento.toISOString().split('T')[0],
        fornecedor: c.fornecedor,
        categoria: c.categoria,
        status: 'pendente',
        unidade_id: unidadeId,
      }))
    )

    // 9. Create demo contas a receber
    const demoContasReceber = [
      { descricao: 'Venda a prazo - Maria Silva', valor: 350, vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 25), cliente: 'Maria Silva', categoria: 'Vendas' },
      { descricao: 'Serviço prestado - Empresa ABC', valor: 800, vencimento: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1), cliente: 'Empresa ABC Ltda', categoria: 'Serviços' },
      { descricao: 'Mensalidade - João Santos', valor: 150, vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 5), cliente: 'João Santos', categoria: 'Mensalidades' },
    ]

    await supabaseAdmin.from('tb_contas_receber').insert(
      demoContasReceber.map(c => ({
        dominio: domainLower,
        descricao: c.descricao,
        valor: c.valor,
        vencimento: c.vencimento.toISOString().split('T')[0],
        cliente: c.cliente,
        categoria: c.categoria,
        status: 'pendente',
        unidade_id: unidadeId,
      }))
    )

    // Send welcome email if email provided
    if (email) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            email,
            customerName: razao_social,
            dominio: domainLower,
          }),
        })
      } catch (e) {
        console.error('Erro ao enviar email:', e)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cliente de demonstração criado com sucesso!',
      dominio: domainLower,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
