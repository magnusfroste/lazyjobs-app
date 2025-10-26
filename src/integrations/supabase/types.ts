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
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          employment_type: string | null
          experience_level: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          is_remote: boolean | null
          location: string | null
          metadata: Json | null
          posted_at: string | null
          required_skills: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          metadata?: Json | null
          posted_at?: string | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          metadata?: Json | null
          posted_at?: string | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      learned_preferences: {
        Row: {
          avg_time_per_card: number | null
          avoided_companies: Json | null
          avoided_keywords: Json | null
          avoided_locations: Json | null
          company_size_weight: number | null
          confidence_score: number | null
          id: string
          last_updated: string | null
          location_weight: number | null
          min_acceptable_match_score: number | null
          min_salary_threshold: number | null
          preferred_companies: Json | null
          preferred_industries: Json | null
          preferred_job_titles: Json | null
          preferred_locations: Json | null
          remote_weight: number | null
          right_swipe_rate: number | null
          salary_weight: number | null
          skills_weight: number | null
          total_swipes: number | null
          user_id: string
        }
        Insert: {
          avg_time_per_card?: number | null
          avoided_companies?: Json | null
          avoided_keywords?: Json | null
          avoided_locations?: Json | null
          company_size_weight?: number | null
          confidence_score?: number | null
          id?: string
          last_updated?: string | null
          location_weight?: number | null
          min_acceptable_match_score?: number | null
          min_salary_threshold?: number | null
          preferred_companies?: Json | null
          preferred_industries?: Json | null
          preferred_job_titles?: Json | null
          preferred_locations?: Json | null
          remote_weight?: number | null
          right_swipe_rate?: number | null
          salary_weight?: number | null
          skills_weight?: number | null
          total_swipes?: number | null
          user_id: string
        }
        Update: {
          avg_time_per_card?: number | null
          avoided_companies?: Json | null
          avoided_keywords?: Json | null
          avoided_locations?: Json | null
          company_size_weight?: number | null
          confidence_score?: number | null
          id?: string
          last_updated?: string | null
          location_weight?: number | null
          min_acceptable_match_score?: number | null
          min_salary_threshold?: number | null
          preferred_companies?: Json | null
          preferred_industries?: Json | null
          preferred_job_titles?: Json | null
          preferred_locations?: Json | null
          remote_weight?: number | null
          right_swipe_rate?: number | null
          salary_weight?: number | null
          skills_weight?: number | null
          total_swipes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          applied_at: string | null
          created_at: string | null
          id: string
          is_applied: boolean | null
          job_id: string | null
          match_score: number | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          job_id?: string | null
          match_score?: number | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          job_id?: string | null
          match_score?: number | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          application_language_preference: string | null
          avatar_url: string | null
          created_at: string | null
          cv_data: Json | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          application_language_preference?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cv_data?: Json | null
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          application_language_preference?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cv_data?: Json | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      swipe_events: {
        Row: {
          company_name: string | null
          created_at: string | null
          device_type: string | null
          direction: string
          employment_type: string | null
          experience_level: string | null
          id: string
          is_remote: boolean | null
          job_id: string
          job_title: string | null
          location: string | null
          match_score: number | null
          required_skills: Json | null
          salary_max: number | null
          salary_min: number | null
          session_id: string | null
          time_spent_seconds: number | null
          user_id: string
          viewed_breakdown: boolean | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          device_type?: string | null
          direction: string
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          is_remote?: boolean | null
          job_id: string
          job_title?: string | null
          location?: string | null
          match_score?: number | null
          required_skills?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_id: string
          viewed_breakdown?: boolean | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          device_type?: string | null
          direction?: string
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          is_remote?: boolean | null
          job_id?: string
          job_title?: string | null
          location?: string | null
          match_score?: number | null
          required_skills?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string
          viewed_breakdown?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "swipe_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          job_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          job_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          job_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swipes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
