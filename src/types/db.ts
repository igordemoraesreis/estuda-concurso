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
      assuntos: {
        Row: {
          created_at: string
          disciplina_id: string
          id: string
          nome: string
          ordem: number
          user_id: string
        }
        Insert: {
          created_at?: string
          disciplina_id: string
          id?: string
          nome: string
          ordem?: number
          user_id: string
        }
        Update: {
          created_at?: string
          disciplina_id?: string
          id?: string
          nome?: string
          ordem?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assuntos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      concursos: {
        Row: {
          archived_at: string | null
          banca: string | null
          cargo: string | null
          created_at: string
          data_prova: string | null
          id: string
          nome: string
          status: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          banca?: string | null
          cargo?: string | null
          created_at?: string
          data_prova?: string | null
          id?: string
          nome: string
          status?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          banca?: string | null
          cargo?: string | null
          created_at?: string
          data_prova?: string | null
          id?: string
          nome?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          concurso_id: string
          created_at: string
          id: string
          nome: string
          ordem: number
          peso: number
          user_id: string
        }
        Insert: {
          concurso_id: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          peso?: number
          user_id: string
        }
        Update: {
          concurso_id?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          peso?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_concurso_id: string | null
          created_at: string
          display_name: string | null
          id: string
          settings: Json
        }
        Insert: {
          active_concurso_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          settings?: Json
        }
        Update: {
          active_concurso_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_concurso_fk"
            columns: ["active_concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_estudo: {
        Row: {
          created_at: string
          duracao_segundos: number
          id: string
          iniciada_em: string
          nota: string | null
          origem: string
          topico_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duracao_segundos: number
          id?: string
          iniciada_em: string
          nota?: string | null
          origem: string
          topico_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duracao_segundos?: number
          id?: string
          iniciada_em?: string
          nota?: string | null
          origem?: string
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_estudo_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_exercicio: {
        Row: {
          acertos: number
          created_at: string
          data: string
          erros: number
          id: string
          nota: string | null
          topico_id: string
          user_id: string
        }
        Insert: {
          acertos: number
          created_at?: string
          data: string
          erros: number
          id?: string
          nota?: string | null
          topico_id: string
          user_id: string
        }
        Update: {
          acertos?: number
          created_at?: string
          data?: string
          erros?: number
          id?: string
          nota?: string | null
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_exercicio_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      topicos: {
        Row: {
          assunto_id: string | null
          concluido: boolean
          concluido_em: string | null
          created_at: string
          disciplina_id: string
          id: string
          nome: string
          ordem: number
          user_id: string
        }
        Insert: {
          assunto_id?: string | null
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          disciplina_id: string
          id?: string
          nome: string
          ordem?: number
          user_id: string
        }
        Update: {
          assunto_id?: string | null
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          disciplina_id?: string
          id?: string
          nome?: string
          ordem?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topicos_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topicos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      sync_concluido_em: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      validar_assunto_disciplina: {
        Args: Record<PropertyKey, never>
        Returns: unknown
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
