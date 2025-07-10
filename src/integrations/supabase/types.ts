export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          battery_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          severity: Database["public"]["Enums"]["issue_severity"]
          title: string
          user_id: string | null
        }
        Insert: {
          battery_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          severity: Database["public"]["Enums"]["issue_severity"]
          title: string
          user_id?: string | null
        }
        Update: {
          battery_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_battery_id_fkey"
            columns: ["battery_id"]
            isOneToOne: false
            referencedRelation: "batteries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batteries: {
        Row: {
          battery_id: string
          chemistry: Database["public"]["Enums"]["battery_chemistry"]
          created_at: string | null
          cycles: number
          grade: Database["public"]["Enums"]["battery_grade"]
          id: string
          notes: string | null
          rul: number
          soh: number
          status: Database["public"]["Enums"]["battery_status"]
          updated_at: string | null
          upload_date: string | null
          user_id: string | null
        }
        Insert: {
          battery_id: string
          chemistry: Database["public"]["Enums"]["battery_chemistry"]
          created_at?: string | null
          cycles?: number
          grade: Database["public"]["Enums"]["battery_grade"]
          id?: string
          notes?: string | null
          rul: number
          soh: number
          status: Database["public"]["Enums"]["battery_status"]
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Update: {
          battery_id?: string
          chemistry?: Database["public"]["Enums"]["battery_chemistry"]
          created_at?: string | null
          cycles?: number
          grade?: Database["public"]["Enums"]["battery_grade"]
          id?: string
          notes?: string | null
          rul?: number
          soh?: number
          status?: Database["public"]["Enums"]["battery_status"]
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batteries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battery_alerts: {
        Row: {
          alert_type: string
          battery_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_id: string
          sender_id: string
          title: string
        }
        Insert: {
          alert_type: string
          battery_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_id: string
          sender_id: string
          title: string
        }
        Update: {
          alert_type?: string
          battery_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_id?: string
          sender_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "battery_alerts_battery_id_fkey"
            columns: ["battery_id"]
            isOneToOne: false
            referencedRelation: "user_batteries"
            referencedColumns: ["id"]
          },
        ]
      }
      battery_issues: {
        Row: {
          affected_metrics: string[] | null
          battery_id: string | null
          category: Database["public"]["Enums"]["issue_category"]
          cause: string | null
          created_at: string | null
          description: string
          id: string
          recommendation: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          solution: string | null
          title: string
        }
        Insert: {
          affected_metrics?: string[] | null
          battery_id?: string | null
          category: Database["public"]["Enums"]["issue_category"]
          cause?: string | null
          created_at?: string | null
          description: string
          id?: string
          recommendation?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          solution?: string | null
          title: string
        }
        Update: {
          affected_metrics?: string[] | null
          battery_id?: string | null
          category?: Database["public"]["Enums"]["issue_category"]
          cause?: string | null
          created_at?: string | null
          description?: string
          id?: string
          recommendation?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          solution?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "battery_issues_battery_id_fkey"
            columns: ["battery_id"]
            isOneToOne: false
            referencedRelation: "batteries"
            referencedColumns: ["id"]
          },
        ]
      }
      battery_metrics: {
        Row: {
          battery_id: string | null
          calculated_at: string | null
          calendar_life: number | null
          capacity_retention: number | null
          charging_efficiency: number | null
          cycle_life: number | null
          discharging_efficiency: number | null
          energy_density: number | null
          energy_efficiency: number | null
          id: string
          impedance_growth: number | null
          internal_resistance: number | null
          peak_power: number | null
          power_fade_rate: number | null
          self_discharge_rate: number | null
          temp_avg: number | null
          temp_max: number | null
          temp_min: number | null
          thermal_stability: string | null
          voltage_avg: number | null
          voltage_max: number | null
          voltage_min: number | null
        }
        Insert: {
          battery_id?: string | null
          calculated_at?: string | null
          calendar_life?: number | null
          capacity_retention?: number | null
          charging_efficiency?: number | null
          cycle_life?: number | null
          discharging_efficiency?: number | null
          energy_density?: number | null
          energy_efficiency?: number | null
          id?: string
          impedance_growth?: number | null
          internal_resistance?: number | null
          peak_power?: number | null
          power_fade_rate?: number | null
          self_discharge_rate?: number | null
          temp_avg?: number | null
          temp_max?: number | null
          temp_min?: number | null
          thermal_stability?: string | null
          voltage_avg?: number | null
          voltage_max?: number | null
          voltage_min?: number | null
        }
        Update: {
          battery_id?: string | null
          calculated_at?: string | null
          calendar_life?: number | null
          capacity_retention?: number | null
          charging_efficiency?: number | null
          cycle_life?: number | null
          discharging_efficiency?: number | null
          energy_density?: number | null
          energy_efficiency?: number | null
          id?: string
          impedance_growth?: number | null
          internal_resistance?: number | null
          peak_power?: number | null
          power_fade_rate?: number | null
          self_discharge_rate?: number | null
          temp_avg?: number | null
          temp_max?: number | null
          temp_min?: number | null
          thermal_stability?: string | null
          voltage_avg?: number | null
          voltage_max?: number | null
          voltage_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battery_metrics_battery_id_fkey"
            columns: ["battery_id"]
            isOneToOne: false
            referencedRelation: "batteries"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_invitations: {
        Row: {
          accepted: boolean | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
        }
        Insert: {
          accepted?: boolean | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
        }
        Update: {
          accepted?: boolean | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          is_demo: boolean | null
          last_name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          is_demo?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      raw_data: {
        Row: {
          battery_id: string | null
          capacity_mah: number | null
          created_at: string | null
          current_a: number | null
          cycle_number: number | null
          id: string
          step_type: string | null
          temperature_c: number | null
          time_seconds: number | null
          voltage_v: number | null
        }
        Insert: {
          battery_id?: string | null
          capacity_mah?: number | null
          created_at?: string | null
          current_a?: number | null
          cycle_number?: number | null
          id?: string
          step_type?: string | null
          temperature_c?: number | null
          time_seconds?: number | null
          voltage_v?: number | null
        }
        Update: {
          battery_id?: string | null
          capacity_mah?: number | null
          created_at?: string | null
          current_a?: number | null
          cycle_number?: number | null
          id?: string
          step_type?: string | null
          temperature_c?: number | null
          time_seconds?: number | null
          voltage_v?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_data_battery_id_fkey"
            columns: ["battery_id"]
            isOneToOne: false
            referencedRelation: "batteries"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          battery_ids: string[] | null
          generated_at: string | null
          id: string
          report_data: Json | null
          report_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          battery_ids?: string[] | null
          generated_at?: string | null
          id?: string
          report_data?: Json | null
          report_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          battery_ids?: string[] | null
          generated_at?: string | null
          id?: string
          report_data?: Json | null
          report_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      soh_history: {
        Row: {
          battery_id: string | null
          cycle_number: number
          id: string
          recorded_at: string | null
          soh: number
        }
        Insert: {
          battery_id?: string | null
          cycle_number: number
          id?: string
          recorded_at?: string | null
          soh: number
        }
        Update: {
          battery_id?: string | null
          cycle_number?: number
          id?: string
          recorded_at?: string | null
          soh?: number
        }
        Relationships: [
          {
            foreignKeyName: "soh_history_battery_id_fkey"
            columns: ["battery_id"]
            isOneToOne: false
            referencedRelation: "batteries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_batteries: {
        Row: {
          chemistry: string
          company_id: string | null
          created_at: string | null
          cycles: number
          grade: string
          id: string
          issues: Json | null
          notes: string | null
          raw_data: Json | null
          rul: number
          soh: number
          soh_history: Json | null
          status: string
          updated_at: string | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          chemistry: string
          company_id?: string | null
          created_at?: string | null
          cycles: number
          grade: string
          id: string
          issues?: Json | null
          notes?: string | null
          raw_data?: Json | null
          rul: number
          soh: number
          soh_history?: Json | null
          status: string
          updated_at?: string | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          chemistry?: string
          company_id?: string | null
          created_at?: string | null
          cycles?: number
          grade?: string
          id?: string
          issues?: Json | null
          notes?: string | null
          raw_data?: Json | null
          rul?: number
          soh?: number
          soh_history?: Json | null
          status?: string
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_batteries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed_steps: Json | null
          created_at: string
          id: string
          is_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: Json | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: Json | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_company_invitation: {
        Args: { invitation_id: string }
        Returns: boolean
      }
      can_access_battery: {
        Args: { _user_id: string; _battery_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_company_admin_or_owner: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: boolean
      }
      is_company_owner_or_admin: {
        Args: { company_id_param: string; user_id_param: string }
        Returns: boolean
      }
      setup_demo_user: {
        Args: { user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "engineer" | "technician" | "viewer"
      battery_chemistry: "LFP" | "NMC"
      battery_grade: "A" | "B" | "C" | "D"
      battery_status: "Healthy" | "Degrading" | "Critical" | "Unknown"
      issue_category: "Performance" | "Safety" | "Maintenance" | "Operational"
      issue_severity: "Critical" | "Warning" | "Info"
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
      app_role: ["admin", "engineer", "technician", "viewer"],
      battery_chemistry: ["LFP", "NMC"],
      battery_grade: ["A", "B", "C", "D"],
      battery_status: ["Healthy", "Degrading", "Critical", "Unknown"],
      issue_category: ["Performance", "Safety", "Maintenance", "Operational"],
      issue_severity: ["Critical", "Warning", "Info"],
    },
  },
} as const
