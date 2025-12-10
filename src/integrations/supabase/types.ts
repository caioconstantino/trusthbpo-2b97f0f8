export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      tb_agenda_config: {
        Row: {
          ativo: boolean
          created_at: string
          dias_funcionamento: number[]
          dominio: string
          horario_fim: string
          horario_inicio: string
          id: string
          intervalo_minutos: number
          nome: string
          slug: string
          tipo: string
          unidade_id: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dias_funcionamento?: number[]
          dominio: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          intervalo_minutos?: number
          nome?: string
          slug: string
          tipo?: string
          unidade_id?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dias_funcionamento?: number[]
          dominio?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          intervalo_minutos?: number
          nome?: string
          slug?: string
          tipo?: string
          unidade_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_agenda_config_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_agenda_servicos: {
        Row: {
          agenda_config_id: string
          ativo: boolean
          created_at: string
          duracao_minutos: number
          id: string
          produto_id: number
        }
        Insert: {
          agenda_config_id: string
          ativo?: boolean
          created_at?: string
          duracao_minutos?: number
          id?: string
          produto_id: number
        }
        Update: {
          agenda_config_id?: string
          ativo?: boolean
          created_at?: string
          duracao_minutos?: number
          id?: string
          produto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tb_agenda_servicos_agenda_config_id_fkey"
            columns: ["agenda_config_id"]
            isOneToOne: false
            referencedRelation: "tb_agenda_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_agenda_servicos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "tb_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_agendamentos: {
        Row: {
          agenda_config_id: string
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          dominio: string
          id: string
          observacoes: string | null
          produto_id: number | null
          status: string
          tipo: string
          titulo: string
          unidade_id: number | null
          updated_at: string
        }
        Insert: {
          agenda_config_id: string
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          dominio: string
          id?: string
          observacoes?: string | null
          produto_id?: number | null
          status?: string
          tipo?: string
          titulo: string
          unidade_id?: number | null
          updated_at?: string
        }
        Update: {
          agenda_config_id?: string
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          dominio?: string
          id?: string
          observacoes?: string | null
          produto_id?: number | null
          status?: string
          tipo?: string
          titulo?: string
          unidade_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_agendamentos_agenda_config_id_fkey"
            columns: ["agenda_config_id"]
            isOneToOne: false
            referencedRelation: "tb_agenda_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_agendamentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "tb_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_agendamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_alunos: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          dominio: string | null
          email: string
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          escola_id: number
          id: string
          nome: string
          professor_id: string
          senha_temp: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          dominio?: string | null
          email: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          escola_id: number
          id?: string
          nome: string
          professor_id: string
          senha_temp?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          dominio?: string | null
          email?: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          escola_id?: number
          id?: string
          nome?: string
          professor_id?: string
          senha_temp?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_alunos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "tb_escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_alunos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "tb_professores"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_categorias: {
        Row: {
          created_at: string | null
          dominio: string
          id: number
          nome: string
          unidade_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dominio: string
          id?: number
          nome: string
          unidade_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dominio?: string
          id?: number
          nome?: string
          unidade_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_categorias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_categorias_contas_pagar: {
        Row: {
          created_at: string | null
          dominio: string
          edit: string
          id: number
          nome: string | null
          parent_id: number | null
          unidade_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dominio: string
          edit?: string
          id?: number
          nome?: string | null
          parent_id?: number | null
          unidade_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dominio?: string
          edit?: string
          id?: number
          nome?: string | null
          parent_id?: number | null
          unidade_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_categorias_contas_pagar_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_categorias_contas_receber: {
        Row: {
          created_at: string | null
          dominio: string
          edit: string
          id: number
          nome: string | null
          parent_id: number | null
          unidade_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dominio: string
          edit?: string
          id?: number
          nome?: string | null
          parent_id?: number | null
          unidade_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dominio?: string
          edit?: string
          id?: number
          nome?: string | null
          parent_id?: number | null
          unidade_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_categorias_contas_receber_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_clientes: {
        Row: {
          cpf_cnpj: string
          created_at: string | null
          cupom: string | null
          detalhes_cnpj: string | null
          dominio: string
          email: string
          id: number
          multiempresa: string | null
          observacoes: string
          plano: string | null
          proximo_pagamento: string | null
          razao_social: string
          responsavel: string
          status: string
          telefone: string
          ultima_forma_pagamento: string | null
          ultimo_pagamento: string | null
          unidade: number
          unidade_id: number | null
          updated_at: string | null
          usuario: number
        }
        Insert: {
          cpf_cnpj: string
          created_at?: string | null
          cupom?: string | null
          detalhes_cnpj?: string | null
          dominio: string
          email: string
          id?: number
          multiempresa?: string | null
          observacoes: string
          plano?: string | null
          proximo_pagamento?: string | null
          razao_social: string
          responsavel: string
          status: string
          telefone: string
          ultima_forma_pagamento?: string | null
          ultimo_pagamento?: string | null
          unidade?: number
          unidade_id?: number | null
          updated_at?: string | null
          usuario?: number
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string | null
          cupom?: string | null
          detalhes_cnpj?: string | null
          dominio?: string
          email?: string
          id?: number
          multiempresa?: string | null
          observacoes?: string
          plano?: string | null
          proximo_pagamento?: string | null
          razao_social?: string
          responsavel?: string
          status?: string
          telefone?: string
          ultima_forma_pagamento?: string | null
          ultimo_pagamento?: string | null
          unidade?: number
          unidade_id?: number | null
          updated_at?: string | null
          usuario?: number
        }
        Relationships: [
          {
            foreignKeyName: "tb_clientes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_clientes_saas: {
        Row: {
          agenda_ativa: boolean
          aluno_id: string | null
          cpf_cnpj: string | null
          created_at: string | null
          cupom: string | null
          dominio: string
          email: string | null
          empresas_adicionais: number
          id: number
          last_login_at: string | null
          multiempresa: string | null
          observacoes: string | null
          pdvs_adicionais: number
          plano: string | null
          produtos_adicionais: number
          proximo_pagamento: string | null
          razao_social: string
          responsavel: string | null
          status: string
          telefone: string | null
          tipo_conta: string | null
          ultima_forma_pagamento: string | null
          ultimo_pagamento: string | null
          updated_at: string | null
          usuarios_adicionais: number
        }
        Insert: {
          agenda_ativa?: boolean
          aluno_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          cupom?: string | null
          dominio: string
          email?: string | null
          empresas_adicionais?: number
          id?: number
          last_login_at?: string | null
          multiempresa?: string | null
          observacoes?: string | null
          pdvs_adicionais?: number
          plano?: string | null
          produtos_adicionais?: number
          proximo_pagamento?: string | null
          razao_social: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          tipo_conta?: string | null
          ultima_forma_pagamento?: string | null
          ultimo_pagamento?: string | null
          updated_at?: string | null
          usuarios_adicionais?: number
        }
        Update: {
          agenda_ativa?: boolean
          aluno_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          cupom?: string | null
          dominio?: string
          email?: string | null
          empresas_adicionais?: number
          id?: number
          last_login_at?: string | null
          multiempresa?: string | null
          observacoes?: string | null
          pdvs_adicionais?: number
          plano?: string | null
          produtos_adicionais?: number
          proximo_pagamento?: string | null
          razao_social?: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          tipo_conta?: string | null
          ultima_forma_pagamento?: string | null
          ultimo_pagamento?: string | null
          updated_at?: string | null
          usuarios_adicionais?: number
        }
        Relationships: [
          {
            foreignKeyName: "tb_clientes_saas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "tb_alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_compras: {
        Row: {
          created_at: string
          dominio: string
          fornecedor: string | null
          id: string
          observacoes: string | null
          status: string
          total: number
          unidade: string | null
          unidade_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dominio: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          total?: number
          unidade?: string | null
          unidade_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dominio?: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          total?: number
          unidade?: string | null
          unidade_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_compras_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_compras_itens: {
        Row: {
          compra_id: string
          created_at: string
          id: string
          preco_custo: number
          produto_id: number
          produto_nome: string
          quantidade: number
          total: number
        }
        Insert: {
          compra_id: string
          created_at?: string
          id?: string
          preco_custo?: number
          produto_id: number
          produto_nome: string
          quantidade?: number
          total?: number
        }
        Update: {
          compra_id?: string
          created_at?: string
          id?: string
          preco_custo?: number
          produto_id?: number
          produto_nome?: string
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "tb_compras_itens_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "tb_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_compras_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "tb_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_contas_pagar: {
        Row: {
          categoria: string | null
          compra_id: string | null
          created_at: string
          data_pagamento: string | null
          descricao: string
          dominio: string
          forma_pagamento: string | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          status: string
          unidade_id: number | null
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: string | null
          compra_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          descricao: string
          dominio: string
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          unidade_id?: number | null
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          categoria?: string | null
          compra_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          descricao?: string
          dominio?: string
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          unidade_id?: number | null
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_contas_pagar_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "tb_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_contas_pagar_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_contas_receber: {
        Row: {
          categoria: string | null
          cliente: string | null
          created_at: string
          data_recebimento: string | null
          descricao: string
          dominio: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          status: string
          unidade_id: number | null
          updated_at: string
          valor: number
          vencimento: string
          venda_id: string | null
        }
        Insert: {
          categoria?: string | null
          cliente?: string | null
          created_at?: string
          data_recebimento?: string | null
          descricao: string
          dominio: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          unidade_id?: number | null
          updated_at?: string
          valor?: number
          vencimento: string
          venda_id?: string | null
        }
        Update: {
          categoria?: string | null
          cliente?: string | null
          created_at?: string
          data_recebimento?: string | null
          descricao?: string
          dominio?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          unidade_id?: number | null
          updated_at?: string
          valor?: number
          vencimento?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_contas_receber_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_escolas: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          cupom: number
          email: string | null
          id: number
          logo_url: string | null
          nome: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          cupom?: number
          email?: string | null
          id?: number
          logo_url?: string | null
          nome: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          cupom?: number
          email?: string | null
          id?: number
          logo_url?: string | null
          nome?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tb_estq_unidades: {
        Row: {
          created_at: string | null
          dominio: string
          id: number
          produto_id: number
          quantidade: number
          quantidade_minima: number
          unidade_id: number
          updated_at: string | null
          variante_id: number
        }
        Insert: {
          created_at?: string | null
          dominio: string
          id?: number
          produto_id: number
          quantidade?: number
          quantidade_minima?: number
          unidade_id: number
          updated_at?: string | null
          variante_id?: number
        }
        Update: {
          created_at?: string | null
          dominio?: string
          id?: number
          produto_id?: number
          quantidade?: number
          quantidade_minima?: number
          unidade_id?: number
          updated_at?: string | null
          variante_id?: number
        }
        Relationships: []
      }
      tb_grupos_permissao: {
        Row: {
          created_at: string
          descricao: string | null
          dominio: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          dominio: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          dominio?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      tb_grupos_permissao_modulos: {
        Row: {
          created_at: string
          editar: boolean
          excluir: boolean
          grupo_id: string
          id: string
          modulo: string
          visualizar: boolean
        }
        Insert: {
          created_at?: string
          editar?: boolean
          excluir?: boolean
          grupo_id: string
          id?: string
          modulo: string
          visualizar?: boolean
        }
        Update: {
          created_at?: string
          editar?: boolean
          excluir?: boolean
          grupo_id?: string
          id?: string
          modulo?: string
          visualizar?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tb_grupos_permissao_modulos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "tb_grupos_permissao"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_indicacoes: {
        Row: {
          created_at: string
          data_conversao: string | null
          id: string
          indicado_dominio: string
          indicado_email: string | null
          indicado_nome: string
          indicador_dominio: string
          percentual_comissao: number
          status: string
          updated_at: string
          valor_assinatura: number
          valor_comissao: number
        }
        Insert: {
          created_at?: string
          data_conversao?: string | null
          id?: string
          indicado_dominio: string
          indicado_email?: string | null
          indicado_nome: string
          indicador_dominio: string
          percentual_comissao?: number
          status?: string
          updated_at?: string
          valor_assinatura?: number
          valor_comissao?: number
        }
        Update: {
          created_at?: string
          data_conversao?: string | null
          id?: string
          indicado_dominio?: string
          indicado_email?: string | null
          indicado_nome?: string
          indicador_dominio?: string
          percentual_comissao?: number
          status?: string
          updated_at?: string
          valor_assinatura?: number
          valor_comissao?: number
        }
        Relationships: []
      }
      tb_indicacoes_config: {
        Row: {
          codigo: string
          created_at: string
          dominio: string
          id: string
          link_slug: string
          saldo: number
          total_ganho: number
          total_sacado: number
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          dominio: string
          id?: string
          link_slug: string
          saldo?: number
          total_ganho?: number
          total_sacado?: number
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          dominio?: string
          id?: string
          link_slug?: string
          saldo?: number
          total_ganho?: number
          total_sacado?: number
          updated_at?: string
        }
        Relationships: []
      }
      tb_ofertas_produtos: {
        Row: {
          ativo: boolean
          created_at: string
          desconto_percentual: number
          descricao: string | null
          funcionalidades: string[] | null
          id: string
          imagem_url: string | null
          link: string | null
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          desconto_percentual?: number
          descricao?: string | null
          funcionalidades?: string[] | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          desconto_percentual?: number
          descricao?: string | null
          funcionalidades?: string[] | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      tb_produtos: {
        Row: {
          ativo: boolean | null
          categoria_id: number | null
          codigo: string | null
          codigo_barras: string | null
          created_at: string | null
          dominio: string
          id: number
          imagem_url: string | null
          nome: string
          observacao: string | null
          preco_custo: number | null
          preco_venda: number | null
          tipo: string | null
          unidade_id: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: number | null
          codigo?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          dominio: string
          id?: number
          imagem_url?: string | null
          nome: string
          observacao?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          tipo?: string | null
          unidade_id?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: number | null
          codigo?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          dominio?: string
          id?: number
          imagem_url?: string | null
          nome?: string
          observacao?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          tipo?: string | null
          unidade_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "tb_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_produtos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_professores: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          created_at: string
          email: string
          escola_id: number
          id: string
          nome: string
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          created_at?: string
          email: string
          escola_id: number
          id?: string
          nome: string
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          created_at?: string
          email?: string
          escola_id?: number
          id?: string
          nome?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_professores_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "tb_escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_revendas: {
        Row: {
          auth_user_id: string | null
          comissao_percentual: number
          created_at: string
          documento: string | null
          email: string
          id: string
          nome: string
          saldo: number
          slug: string | null
          status: string
          telefone: string | null
          total_ganho: number
          total_sacado: number
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          comissao_percentual?: number
          created_at?: string
          documento?: string | null
          email: string
          id?: string
          nome: string
          saldo?: number
          slug?: string | null
          status?: string
          telefone?: string | null
          total_ganho?: number
          total_sacado?: number
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          comissao_percentual?: number
          created_at?: string
          documento?: string | null
          email?: string
          id?: string
          nome?: string
          saldo?: number
          slug?: string | null
          status?: string
          telefone?: string | null
          total_ganho?: number
          total_sacado?: number
          updated_at?: string
        }
        Relationships: []
      }
      tb_revendas_produtos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          preco_original: number
          preco_revenda: number
          produto_codigo: string
          produto_nome: string
          revenda_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          preco_original?: number
          preco_revenda?: number
          produto_codigo: string
          produto_nome: string
          revenda_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          preco_original?: number
          preco_revenda?: number
          produto_codigo?: string
          produto_nome?: string
          revenda_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_revendas_produtos_revenda_id_fkey"
            columns: ["revenda_id"]
            isOneToOne: false
            referencedRelation: "tb_revendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_revendas_vendas: {
        Row: {
          cliente_dominio: string | null
          cliente_email: string | null
          cliente_nome: string
          created_at: string
          data_pagamento: string | null
          id: string
          lucro: number
          produto_codigo: string
          produto_nome: string
          revenda_id: string
          status: string
          updated_at: string
          valor_original: number
          valor_venda: number
        }
        Insert: {
          cliente_dominio?: string | null
          cliente_email?: string | null
          cliente_nome: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          lucro?: number
          produto_codigo: string
          produto_nome: string
          revenda_id: string
          status?: string
          updated_at?: string
          valor_original?: number
          valor_venda?: number
        }
        Update: {
          cliente_dominio?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          lucro?: number
          produto_codigo?: string
          produto_nome?: string
          revenda_id?: string
          status?: string
          updated_at?: string
          valor_original?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "tb_revendas_vendas_revenda_id_fkey"
            columns: ["revenda_id"]
            isOneToOne: false
            referencedRelation: "tb_revendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_sangrias: {
        Row: {
          created_at: string
          dominio: string
          id: string
          motivo: string | null
          sessao_id: string
          unidade_id: number | null
          valor: number
        }
        Insert: {
          created_at?: string
          dominio: string
          id?: string
          motivo?: string | null
          sessao_id: string
          unidade_id?: number | null
          valor?: number
        }
        Update: {
          created_at?: string
          dominio?: string
          id?: string
          motivo?: string | null
          sessao_id?: string
          unidade_id?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tb_sangrias_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "tb_sessoes_caixa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_sangrias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_saques: {
        Row: {
          chave_pix: string | null
          created_at: string
          data_processamento: string | null
          dominio: string
          id: string
          observacoes: string | null
          status: string
          tipo_chave_pix: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string
          data_processamento?: string | null
          dominio: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo_chave_pix?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          chave_pix?: string | null
          created_at?: string
          data_processamento?: string | null
          dominio?: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo_chave_pix?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      tb_sessoes_caixa: {
        Row: {
          caixa_nome: string
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          dominio: string
          id: string
          observacoes: string | null
          status: string
          unidade_id: number | null
          updated_at: string
          usuario_id: string
          usuario_nome: string
          valor_abertura: number
          valor_fechamento: number | null
        }
        Insert: {
          caixa_nome?: string
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          dominio: string
          id?: string
          observacoes?: string | null
          status?: string
          unidade_id?: number | null
          updated_at?: string
          usuario_id: string
          usuario_nome: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Update: {
          caixa_nome?: string
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          dominio?: string
          id?: string
          observacoes?: string | null
          status?: string
          unidade_id?: number | null
          updated_at?: string
          usuario_id?: string
          usuario_nome?: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_sessoes_caixa_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_unidades: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dominio: string
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          id: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dominio: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          id?: number
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dominio?: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          id?: number
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tb_usuarios: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          dominio: string
          email: string
          grupo_id: string | null
          id: string
          nome: string
          status: string | null
          unidades_acesso: number[] | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          dominio: string
          email: string
          grupo_id?: string | null
          id?: string
          nome: string
          status?: string | null
          unidades_acesso?: number[] | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          dominio?: string
          email?: string
          grupo_id?: string | null
          id?: string
          nome?: string
          status?: string | null
          unidades_acesso?: number[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_usuarios_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "tb_grupos_permissao"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_vendas: {
        Row: {
          acrescimo_percentual: number
          cliente_nome: string | null
          created_at: string
          desconto_percentual: number
          dominio: string
          id: string
          sessao_id: string | null
          subtotal: number
          total: number
          troco: number
          unidade_id: number | null
        }
        Insert: {
          acrescimo_percentual?: number
          cliente_nome?: string | null
          created_at?: string
          desconto_percentual?: number
          dominio: string
          id?: string
          sessao_id?: string | null
          subtotal?: number
          total?: number
          troco?: number
          unidade_id?: number | null
        }
        Update: {
          acrescimo_percentual?: number
          cliente_nome?: string | null
          created_at?: string
          desconto_percentual?: number
          dominio?: string
          id?: string
          sessao_id?: string | null
          subtotal?: number
          total?: number
          troco?: number
          unidade_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_vendas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "tb_sessoes_caixa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_vendas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "tb_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_vendas_itens: {
        Row: {
          created_at: string
          id: string
          preco_unitario: number
          produto_id: number
          produto_nome: string
          quantidade: number
          total: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco_unitario?: number
          produto_id: number
          produto_nome: string
          quantidade?: number
          total?: number
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preco_unitario?: number
          produto_id?: number
          produto_nome?: string
          quantidade?: number
          total?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "tb_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_vendas_pagamentos: {
        Row: {
          created_at: string
          forma_pagamento: string
          id: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          forma_pagamento: string
          id?: string
          valor?: number
          venda_id: string
        }
        Update: {
          created_at?: string
          forma_pagamento?: string
          id?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_vendas_pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "tb_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_webhooks: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validar_dominio: {
        Args: { p_dominio: string }
        Returns: {
          existe: boolean
          nome_cliente: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
