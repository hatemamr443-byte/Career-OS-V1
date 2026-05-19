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
      ai_context_snapshots: {
        Row: {
          context_hash: string
          created_at: string
          feature: string
          id: string
          model: string
          tokens_in: number
          user_id: string
        }
        Insert: {
          context_hash: string
          created_at?: string
          feature: string
          id?: string
          model?: string
          tokens_in?: number
          user_id: string
        }
        Update: {
          context_hash?: string
          created_at?: string
          feature?: string
          id?: string
          model?: string
          tokens_in?: number
          user_id?: string
        }
        Relationships: []
      }
      career_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          ref_id: string | null
          source: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          ref_id?: string | null
          source?: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          ref_id?: string | null
          source?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      career_insights: {
        Row: {
          body: string
          created_at: string
          evidence: Json
          id: string
          kind: string
          title: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          body: string
          created_at?: string
          evidence?: Json
          id?: string
          kind: string
          title: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          evidence?: Json
          id?: string
          kind?: string
          title?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      career_memory: {
        Row: {
          confidence: number
          id: string
          key: string
          source: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          confidence?: number
          id?: string
          key: string
          source?: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          confidence?: number
          id?: string
          key?: string
          source?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          burnout_risk: number
          confidence: number
          created_at: string
          decision: string
          evidence_event_ids: string[]
          fit_score: number
          growth_score: number
          id: string
          job_id: string
          model: string
          reasoning: string
          roi_score: number
          salary_alignment: number
          strengths: string[]
          tradeoffs: Json
          user_id: string
          weaknesses: string[]
        }
        Insert: {
          burnout_risk?: number
          confidence?: number
          created_at?: string
          decision: string
          evidence_event_ids?: string[]
          fit_score?: number
          growth_score?: number
          id?: string
          job_id: string
          model?: string
          reasoning?: string
          roi_score?: number
          salary_alignment?: number
          strengths?: string[]
          tradeoffs?: Json
          user_id: string
          weaknesses?: string[]
        }
        Update: {
          burnout_risk?: number
          confidence?: number
          created_at?: string
          decision?: string
          evidence_event_ids?: string[]
          fit_score?: number
          growth_score?: number
          id?: string
          job_id?: string
          model?: string
          reasoning?: string
          roi_score?: number
          salary_alignment?: number
          strengths?: string[]
          tradeoffs?: Json
          user_id?: string
          weaknesses?: string[]
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          description: string | null
          embedding: string | null
          id: string
          location: string | null
          notes: string | null
          role: string
          salary_range: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          role: string
          salary_range?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          role?: string
          salary_range?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_scores: {
        Row: {
          created_at: string
          cv_snapshot: string | null
          id: string
          jd_snapshot: string | null
          job_id: string
          model: string
          recommendation: string
          score: number
          strengths: string[]
          user_id: string
          weaknesses: string[]
        }
        Insert: {
          created_at?: string
          cv_snapshot?: string | null
          id?: string
          jd_snapshot?: string | null
          job_id: string
          model?: string
          recommendation?: string
          score: number
          strengths?: string[]
          user_id: string
          weaknesses?: string[]
        }
        Update: {
          created_at?: string
          cv_snapshot?: string | null
          id?: string
          jd_snapshot?: string | null
          job_id?: string
          model?: string
          recommendation?: string
          score?: number
          strengths?: string[]
          user_id?: string
          weaknesses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "job_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          career_goals: string | null
          created_at: string
          cv_text: string | null
          digest_enabled: boolean
          email: string | null
          embedding: string | null
          experience_summary: string | null
          experience_years: number | null
          full_name: string | null
          headline: string | null
          id: string
          location: string | null
          skills: string[]
          target_roles: string[]
          updated_at: string
        }
        Insert: {
          career_goals?: string | null
          created_at?: string
          cv_text?: string | null
          digest_enabled?: boolean
          email?: string | null
          embedding?: string | null
          experience_summary?: string | null
          experience_years?: number | null
          full_name?: string | null
          headline?: string | null
          id: string
          location?: string | null
          skills?: string[]
          target_roles?: string[]
          updated_at?: string
        }
        Update: {
          career_goals?: string | null
          created_at?: string
          cv_text?: string | null
          digest_enabled?: boolean
          email?: string | null
          embedding?: string | null
          experience_summary?: string | null
          experience_years?: number | null
          full_name?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          skills?: string[]
          target_roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          current_streak: number
          last_active_date: string | null
          level: number
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          event_type: string
          id: string
          meta: Json
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_career_event: {
        Args: {
          _kind: string
          _payload: Json
          _ref_id: string
          _source: string
          _user_id: string
          _weight?: number
        }
        Returns: string
      }
      award_xp: {
        Args: { _amount: number; _meta?: Json; _type: string; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_jobs_for_user: {
        Args: { match_count?: number; match_threshold?: number }
        Returns: {
          company: string
          job_id: string
          role: string
          similarity: number
        }[]
      }
      upsert_career_memory: {
        Args: {
          _confidence: number
          _key: string
          _source: string
          _user_id: string
          _value: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      job_status:
        | "saved"
        | "applied"
        | "screening"
        | "interview"
        | "offer"
        | "rejected"
        | "ghosted"
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
      job_status: [
        "saved",
        "applied",
        "screening",
        "interview",
        "offer",
        "rejected",
        "ghosted",
      ],
    },
  },
} as const
