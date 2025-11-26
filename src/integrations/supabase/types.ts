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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
