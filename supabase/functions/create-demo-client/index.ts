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

    // 1. Create SaaS client - ALL BILLING ZEROED, NEVER EXPIRES
    const { error: clienteError } = await supabaseAdmin.from('tb_clientes_saas').insert({
      dominio: domainLower,
      razao_social,
      email: email || null,
      status: 'Ativo',
      plano: 'Profissional',
      proximo_pagamento: '2099-12-31',
      ultimo_pagamento: new Date().toISOString().split('T')[0],
      observacoes: '⭐ Conta de demonstração - Sem cobrança, nunca expira.',
      produtos_adicionais: 0,
      pdvs_adicionais: 0,
      empresas_adicionais: 0,
      usuarios_adicionais: 0,
      tipo_conta: 'demo',
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
    const categoriasNomes = ['Bebidas', 'Alimentos', 'Limpeza', 'Higiene', 'Eletrônicos', 'Papelaria', 'Vestuário', 'Diversos']
    const { data: categorias } = await supabaseAdmin
      .from('tb_categorias')
      .insert(categoriasNomes.map(nome => ({ dominio: domainLower, nome, unidade_id: unidadeId })))
      .select('id, nome')

    const catMap: Record<string, number> = {}
    categorias?.forEach(c => { catMap[c.nome] = c.id })

    // 5. Create 35 demo products with image URLs
    const demoProdutos = [
      // Bebidas
      { nome: 'Coca-Cola 350ml', preco_venda: 5.50, preco_custo: 3.20, categoria: 'Bebidas', codigo: 'BEB001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop' },
      { nome: 'Guaraná Antarctica 2L', preco_venda: 8.90, preco_custo: 5.50, categoria: 'Bebidas', codigo: 'BEB002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=200&h=200&fit=crop' },
      { nome: 'Água Mineral 500ml', preco_venda: 3.00, preco_custo: 1.20, categoria: 'Bebidas', codigo: 'BEB003', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop' },
      { nome: 'Suco de Laranja 1L', preco_venda: 7.90, preco_custo: 4.50, categoria: 'Bebidas', codigo: 'BEB004', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop' },
      { nome: 'Cerveja Lata 350ml', preco_venda: 4.50, preco_custo: 2.80, categoria: 'Bebidas', codigo: 'BEB005', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&h=200&fit=crop' },
      { nome: 'Energético 250ml', preco_venda: 9.90, preco_custo: 6.00, categoria: 'Bebidas', codigo: 'BEB006', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=200&h=200&fit=crop' },
      { nome: 'Café Expresso', preco_venda: 6.50, preco_custo: 2.00, categoria: 'Bebidas', codigo: 'BEB007', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=200&h=200&fit=crop' },
      // Alimentos
      { nome: 'Pão de Forma', preco_venda: 8.50, preco_custo: 5.00, categoria: 'Alimentos', codigo: 'ALI001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=200&h=200&fit=crop' },
      { nome: 'Arroz 5kg', preco_venda: 22.90, preco_custo: 16.00, categoria: 'Alimentos', codigo: 'ALI002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
      { nome: 'Feijão Preto 1kg', preco_venda: 8.90, preco_custo: 5.50, categoria: 'Alimentos', codigo: 'ALI003', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=200&h=200&fit=crop' },
      { nome: 'Macarrão Espaguete 500g', preco_venda: 4.90, preco_custo: 2.80, categoria: 'Alimentos', codigo: 'ALI004', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200&h=200&fit=crop' },
      { nome: 'Óleo de Soja 900ml', preco_venda: 7.90, preco_custo: 5.20, categoria: 'Alimentos', codigo: 'ALI005', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop' },
      { nome: 'Biscoito Recheado', preco_venda: 3.90, preco_custo: 2.00, categoria: 'Alimentos', codigo: 'ALI006', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop' },
      { nome: 'Leite Integral 1L', preco_venda: 5.90, preco_custo: 3.80, categoria: 'Alimentos', codigo: 'ALI007', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop' },
      { nome: 'Queijo Mussarela 500g', preco_venda: 24.90, preco_custo: 18.00, categoria: 'Alimentos', codigo: 'ALI008', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop' },
      { nome: 'Chocolate ao Leite', preco_venda: 6.50, preco_custo: 3.50, categoria: 'Alimentos', codigo: 'ALI009', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200&h=200&fit=crop' },
      // Limpeza
      { nome: 'Detergente 500ml', preco_venda: 2.90, preco_custo: 1.50, categoria: 'Limpeza', codigo: 'LIM001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&h=200&fit=crop' },
      { nome: 'Desinfetante 2L', preco_venda: 6.90, preco_custo: 3.80, categoria: 'Limpeza', codigo: 'LIM002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=200&h=200&fit=crop' },
      { nome: 'Sabão em Pó 1kg', preco_venda: 12.90, preco_custo: 8.50, categoria: 'Limpeza', codigo: 'LIM003', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop' },
      { nome: 'Esponja Multiuso', preco_venda: 2.50, preco_custo: 0.80, categoria: 'Limpeza', codigo: 'LIM004', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&h=200&fit=crop' },
      // Higiene
      { nome: 'Sabonete', preco_venda: 2.50, preco_custo: 1.20, categoria: 'Higiene', codigo: 'HIG001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=200&h=200&fit=crop' },
      { nome: 'Shampoo 350ml', preco_venda: 14.90, preco_custo: 8.50, categoria: 'Higiene', codigo: 'HIG002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&h=200&fit=crop' },
      { nome: 'Papel Higiênico 12un', preco_venda: 15.90, preco_custo: 10.00, categoria: 'Higiene', codigo: 'HIG003', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=200&h=200&fit=crop' },
      { nome: 'Creme Dental', preco_venda: 5.90, preco_custo: 3.00, categoria: 'Higiene', codigo: 'HIG004', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1559589688-6ba6beafe1e0?w=200&h=200&fit=crop' },
      { nome: 'Desodorante Roll-on', preco_venda: 11.90, preco_custo: 6.50, categoria: 'Higiene', codigo: 'HIG005', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=200&h=200&fit=crop' },
      // Eletrônicos
      { nome: 'Fone de Ouvido Bluetooth', preco_venda: 89.90, preco_custo: 45.00, categoria: 'Eletrônicos', codigo: 'ELE001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop' },
      { nome: 'Carregador USB-C', preco_venda: 39.90, preco_custo: 18.00, categoria: 'Eletrônicos', codigo: 'ELE002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&h=200&fit=crop' },
      { nome: 'Pilha AA 4un', preco_venda: 12.90, preco_custo: 7.00, categoria: 'Eletrônicos', codigo: 'ELE003', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1619641805634-98e082e1d43a?w=200&h=200&fit=crop' },
      { nome: 'Caixa de Som Portátil', preco_venda: 129.90, preco_custo: 70.00, categoria: 'Eletrônicos', codigo: 'ELE004', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&h=200&fit=crop' },
      // Papelaria
      { nome: 'Caderno 200 Folhas', preco_venda: 18.90, preco_custo: 10.00, categoria: 'Papelaria', codigo: 'PAP001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop' },
      { nome: 'Caneta Esferográfica', preco_venda: 2.50, preco_custo: 0.80, categoria: 'Papelaria', codigo: 'PAP002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=200&h=200&fit=crop' },
      { nome: 'Fita Adesiva', preco_venda: 4.50, preco_custo: 2.00, categoria: 'Papelaria', codigo: 'PAP003', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1589820296156-2092d3aa6eb7?w=200&h=200&fit=crop' },
      // Vestuário
      { nome: 'Camiseta Básica', preco_venda: 39.90, preco_custo: 15.00, categoria: 'Vestuário', codigo: 'VES001', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
      { nome: 'Boné Ajustável', preco_venda: 29.90, preco_custo: 12.00, categoria: 'Vestuário', codigo: 'VES002', tipo: 'produto', imagem_url: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=200&h=200&fit=crop' },
      // Serviços
      { nome: 'Corte de Cabelo', preco_venda: 35.00, preco_custo: 0, categoria: 'Diversos', codigo: 'SRV001', tipo: 'servico', imagem_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&h=200&fit=crop' },
      { nome: 'Manutenção Geral', preco_venda: 80.00, preco_custo: 0, categoria: 'Diversos', codigo: 'SRV002', tipo: 'servico', imagem_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop' },
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
          imagem_url: p.imagem_url,
        }))
      )
      .select('id, nome, preco_venda')

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
      { razao_social: 'Padaria Central', cpf_cnpj: '11.222.333/0001-44', email: 'padaria@email.com', telefone: '(11) 3333-0003', status: 'Ativo' },
      { razao_social: 'Fernando Costa', cpf_cnpj: '111.222.333-44', email: 'fernando@email.com', telefone: '(11) 99999-0005', status: 'Ativo' },
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
      { descricao: 'Fornecedor de Bebidas', valor: 1200, vencimento: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 5), fornecedor: 'Distribuidora Bebidas', categoria: 'Fornecedores' },
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

    // 10. Create 50+ demo sales over the last 30 days
    if (produtos && produtos.length > 0) {
      const clienteNomes = ['Maria Silva', 'João Santos', 'Ana Oliveira', 'Carlos Pereira', 'Fernando Costa', 'Padaria Central', null]
      const formasPagamento = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito']

      const vendasData = []
      const numVendas = 55

      for (let i = 0; i < numVendas; i++) {
        const diasAtras = Math.floor(Math.random() * 30)
        const dataVenda = new Date()
        dataVenda.setDate(dataVenda.getDate() - diasAtras)
        dataVenda.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60))

        // Pick 1-5 random products for this sale
        const numItens = Math.floor(Math.random() * 4) + 1
        const itensVenda = []
        let subtotal = 0

        const produtosShuffled = [...produtos].sort(() => Math.random() - 0.5)
        for (let j = 0; j < Math.min(numItens, produtosShuffled.length); j++) {
          const prod = produtosShuffled[j]
          const qty = Math.floor(Math.random() * 3) + 1
          const total = prod.preco_venda * qty
          subtotal += total
          itensVenda.push({
            produto_id: prod.id,
            produto_nome: prod.nome,
            preco_unitario: prod.preco_venda,
            quantidade: qty,
            total,
          })
        }

        const desconto = Math.random() < 0.2 ? Math.floor(Math.random() * 10) + 1 : 0
        const totalVenda = subtotal * (1 - desconto / 100)
        const clienteNome = clienteNomes[Math.floor(Math.random() * clienteNomes.length)]

        vendasData.push({
          venda: {
            dominio: domainLower,
            subtotal,
            total: Number(totalVenda.toFixed(2)),
            desconto_percentual: desconto,
            acrescimo_percentual: 0,
            troco: 0,
            cliente_nome: clienteNome,
            unidade_id: unidadeId,
            created_at: dataVenda.toISOString(),
          },
          itens: itensVenda,
          forma_pagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
          total: Number(totalVenda.toFixed(2)),
        })
      }

      // Insert all sales
      for (const v of vendasData) {
        const { data: vendaInserted, error: vendaErr } = await supabaseAdmin
          .from('tb_vendas')
          .insert(v.venda)
          .select('id')
          .single()

        if (vendaErr || !vendaInserted) {
          console.error('Erro ao criar venda:', vendaErr)
          continue
        }

        await supabaseAdmin.from('tb_vendas_itens').insert(
          v.itens.map(item => ({
            venda_id: vendaInserted.id,
            ...item,
          }))
        )

        await supabaseAdmin.from('tb_vendas_pagamentos').insert({
          venda_id: vendaInserted.id,
          forma_pagamento: v.forma_pagamento,
          valor: v.total,
        })
      }
    }

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