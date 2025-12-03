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
      tb_categorias: {
        Row: {
          created_at: string | null
          dominio: string
          id: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dominio: string
          id?: number
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dominio?: string
          id?: number
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tb_categorias_contas_pagar: {
        Row: {
          created_at: string | null
          dominio: string
          edit: string
          id: number
          nome: string | null
          parent_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dominio: string
          edit?: string
          id?: number
          nome?: string | null
          parent_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dominio?: string
          edit?: string
          id?: number
          nome?: string | null
          parent_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          updated_at?: string | null
          usuario?: number
        }
        Relationships: []
      }
      tb_clientes_saas: {
        Row: {
          cpf_cnpj: string | null
          created_at: string | null
          cupom: string | null
          dominio: string
          email: string | null
          id: number
          multiempresa: string | null
          observacoes: string | null
          plano: string | null
          proximo_pagamento: string | null
          razao_social: string
          responsavel: string | null
          status: string
          telefone: string | null
          ultima_forma_pagamento: string | null
          ultimo_pagamento: string | null
          updated_at: string | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string | null
          cupom?: string | null
          dominio: string
          email?: string | null
          id?: number
          multiempresa?: string | null
          observacoes?: string | null
          plano?: string | null
          proximo_pagamento?: string | null
          razao_social: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          ultima_forma_pagamento?: string | null
          ultimo_pagamento?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string | null
          cupom?: string | null
          dominio?: string
          email?: string | null
          id?: number
          multiempresa?: string | null
          observacoes?: string | null
          plano?: string | null
          proximo_pagamento?: string | null
          razao_social?: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          ultima_forma_pagamento?: string | null
          ultimo_pagamento?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tb_escolas: {
        Row: {
          created_at: string | null
          cupom: number
          id: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cupom?: number
          id?: number
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cupom?: number
          id?: number
          nome?: string
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
        ]
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
          updated_at?: string
          usuario_id?: string
          usuario_nome?: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Relationships: []
      }
      tb_usuarios: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          dominio: string
          email: string
          id: string
          nome: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          dominio: string
          email: string
          id?: string
          nome: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          dominio?: string
          email?: string
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        }
        Relationships: [
          {
            foreignKeyName: "tb_vendas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "tb_sessoes_caixa"
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
