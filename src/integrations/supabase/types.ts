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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      config: {
        Row: {
          fecha_inicio: string
          id: number
          mes_activo: string
          password_admin: string
          pin_coach: string
          semana_activa: number
        }
        Insert: {
          fecha_inicio?: string
          id?: number
          mes_activo?: string
          password_admin?: string
          pin_coach?: string
          semana_activa?: number
        }
        Update: {
          fecha_inicio?: string
          id?: number
          mes_activo?: string
          password_admin?: string
          pin_coach?: string
          semana_activa?: number
        }
        Relationships: []
      }
      evaluaciones_diarias: {
        Row: {
          aplicacion_tactica: number | null
          asistencia: string
          comunicacion: number | null
          created_at: string
          esfuerzo: number | null
          fecha: string
          id: string
          jugador_id: string
          nota_coach: string | null
          semana: number
          trabajo_equipo: number | null
        }
        Insert: {
          aplicacion_tactica?: number | null
          asistencia: string
          comunicacion?: number | null
          created_at?: string
          esfuerzo?: number | null
          fecha: string
          id?: string
          jugador_id: string
          nota_coach?: string | null
          semana: number
          trabajo_equipo?: number | null
        }
        Update: {
          aplicacion_tactica?: number | null
          asistencia?: string
          comunicacion?: number | null
          created_at?: string
          esfuerzo?: number | null
          fecha?: string
          id?: string
          jugador_id?: string
          nota_coach?: string | null
          semana?: number
          trabajo_equipo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_diarias_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_tecnicas: {
        Row: {
          fecha: string
          id: string
          indicador: string
          jugador_id: string
          nota: string | null
          semana: number
          valor: number
        }
        Insert: {
          fecha: string
          id?: string
          indicador: string
          jugador_id: string
          nota?: string | null
          semana: number
          valor: number
        }
        Update: {
          fecha?: string
          id?: string
          indicador?: string
          jugador_id?: string
          nota?: string | null
          semana?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_tecnicas_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_semanales: {
        Row: {
          created_at: string
          grupo: string
          id: string
          imagen_url: string
          mes: string
          semana: number
        }
        Insert: {
          created_at?: string
          grupo: string
          id?: string
          imagen_url: string
          mes: string
          semana: number
        }
        Update: {
          created_at?: string
          grupo?: string
          id?: string
          imagen_url?: string
          mes?: string
          semana?: number
        }
        Relationships: []
      }
      jugadores: {
        Row: {
          activo: boolean
          codigo_familia: string
          created_at: string
          grupo: string
          id: string
          mes: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo_familia: string
          created_at?: string
          grupo: string
          id?: string
          mes: string
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo_familia?: string
          created_at?: string
          grupo?: string
          id?: string
          mes?: string
          nombre?: string
        }
        Relationships: []
      }
      logros: {
        Row: {
          desbloqueado: boolean
          fecha_desbloqueo: string | null
          id: string
          jugador_id: string
          logro_codigo: string
        }
        Insert: {
          desbloqueado?: boolean
          fecha_desbloqueo?: string | null
          id?: string
          jugador_id: string
          logro_codigo: string
        }
        Update: {
          desbloqueado?: boolean
          fecha_desbloqueo?: string | null
          id?: string
          jugador_id?: string
          logro_codigo?: string
        }
        Relationships: [
          {
            foreignKeyName: "logros_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          fecha_publicacion: string | null
          id: string
          jugador_id: string
          mensaje_coach: string
          publicado: boolean
        }
        Insert: {
          fecha_publicacion?: string | null
          id?: string
          jugador_id: string
          mensaje_coach?: string
          publicado?: boolean
        }
        Update: {
          fecha_publicacion?: string | null
          id?: string
          jugador_id?: string
          mensaje_coach?: string
          publicado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reportes_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: true
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_config: {
        Args: {
          p_fecha_inicio?: string
          p_mes_activo: string
          p_pass: string
          p_password_admin: string
          p_pin_coach: string
          p_semana_activa: number
        }
        Returns: undefined
      }
      cambiar_semana: {
        Args: { p_pin: string; p_semana: number }
        Returns: undefined
      }
      crear_jugador: {
        Args: {
          p_grupo: string
          p_mes: string
          p_nombre: string
          p_pass: string
        }
        Returns: {
          activo: boolean
          codigo_familia: string
          created_at: string
          grupo: string
          id: string
          mes: string
          nombre: string
        }
        SetofOptions: {
          from: "*"
          to: "jugadores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      desbloquear_semana: {
        Args: { p_jugador: string; p_pass: string; p_semana: number }
        Returns: undefined
      }
      generar_codigo_familia: { Args: never; Returns: string }
      get_config: {
        Args: { p_pin: string }
        Returns: {
          fecha_inicio: string
          id: number
          mes_activo: string
          password_admin: string
          pin_coach: string
          semana_activa: number
        }[]
        SetofOptions: {
          from: "*"
          to: "config"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_config_publica: {
        Args: never
        Returns: {
          fecha_inicio: string
          mes_activo: string
          semana_activa: number
        }[]
      }
      get_portal_data: { Args: { p_codigo: string }; Returns: Json }
      get_reporte: {
        Args: { p_jugador: string; p_pass: string }
        Returns: {
          fecha_publicacion: string | null
          id: string
          jugador_id: string
          mensaje_coach: string
          publicado: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "reportes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      guardar_evaluacion_diaria: {
        Args: {
          p_comunicacion: number
          p_equipo: number
          p_esfuerzo: number
          p_fecha: string
          p_jugador: string
          p_nota: string
          p_pin: string
          p_semana: number
          p_tactica: number
        }
        Returns: undefined
      }
      guardar_evaluacion_tecnica: {
        Args: {
          p_fecha: string
          p_indicador: string
          p_jugador: string
          p_nota: string
          p_pin: string
          p_semana: number
          p_valor: number
        }
        Returns: undefined
      }
      guardar_reporte: {
        Args: { p_jugador: string; p_mensaje: string; p_pass: string }
        Returns: undefined
      }
      historial_jugador_coach: {
        Args: { p_jugador: string; p_pin: string }
        Returns: Json
      }
      listar_evaluaciones_dia: {
        Args: { p_fecha: string; p_grupo: string; p_mes: string; p_pin: string }
        Returns: {
          aplicacion_tactica: number
          asistencia: string
          comunicacion: number
          esfuerzo: number
          jugador_id: string
          nombre: string
          nota_coach: string
          trabajo_equipo: number
        }[]
      }
      listar_jugadores: {
        Args: {
          p_grupo?: string
          p_mes?: string
          p_pin: string
          p_solo_activos?: boolean
        }
        Returns: {
          activo: boolean
          codigo_familia: string
          created_at: string
          grupo: string
          id: string
          mes: string
          nombre: string
        }[]
        SetofOptions: {
          from: "*"
          to: "jugadores"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      listar_logros: {
        Args: { p_jugador: string; p_pin: string }
        Returns: {
          desbloqueado: boolean
          fecha_desbloqueo: string | null
          id: string
          jugador_id: string
          logro_codigo: string
        }[]
        SetofOptions: {
          from: "*"
          to: "logros"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      listar_logros_coach: {
        Args: { p_jugador: string; p_pin: string }
        Returns: {
          desbloqueado: boolean
          fecha_desbloqueo: string | null
          id: string
          jugador_id: string
          logro_codigo: string
        }[]
        SetofOptions: {
          from: "*"
          to: "logros"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      publicar_grupo: {
        Args: { p_grupo: string; p_mes: string; p_pass: string }
        Returns: undefined
      }
      publicar_reporte: {
        Args: { p_jugador: string; p_pass: string; p_publicado: boolean }
        Returns: undefined
      }
      registrar_asistencia: {
        Args: {
          p_asistencia: string
          p_fecha: string
          p_jugador: string
          p_pin: string
          p_semana: number
        }
        Returns: undefined
      }
      semaforo: {
        Args: {
          p_grupo: string
          p_mes: string
          p_pass: string
          p_semana: number
        }
        Returns: {
          asistencia: string
          completo: boolean
          fecha: string
          jugador_id: string
          nombre: string
        }[]
      }
      set_activo: {
        Args: { p_activo: boolean; p_jugador: string; p_pass: string }
        Returns: undefined
      }
      subir_foto: {
        Args: {
          p_grupo: string
          p_mes: string
          p_pass: string
          p_semana: number
          p_url: string
        }
        Returns: undefined
      }
      toggle_logro: {
        Args: {
          p_codigo: string
          p_jugador: string
          p_pass: string
          p_valor: boolean
        }
        Returns: undefined
      }
      toggle_logro_coach: {
        Args: {
          p_codigo: string
          p_jugador: string
          p_pin: string
          p_valor: boolean
        }
        Returns: undefined
      }
      verificar_admin: { Args: { p_pass: string }; Returns: boolean }
      verificar_pin: { Args: { p_pin: string }; Returns: boolean }
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
