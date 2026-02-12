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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aptitude_questions: {
        Row: {
          category: string
          correct_answer: number
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: string | null
          id: string
          options: Json
          question: string
        }
        Insert: {
          category?: string
          correct_answer?: number
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          question: string
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      aptitude_sessions: {
        Row: {
          answers: Json | null
          category: string
          completed_at: string | null
          correct_answers: number
          created_at: string
          id: string
          score: number
          status: string
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          category?: string
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          id?: string
          score?: number
          status?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          category?: string
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          id?: string
          score?: number
          status?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      candidate_decisions: {
        Row: {
          created_at: string
          decision: string
          id: string
          notes: string | null
          recruiter_id: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          recruiter_id: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          recruiter_id?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coding_problems: {
        Row: {
          category: string
          constraints: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          hidden_test_cases: Json
          hints: string[] | null
          id: string
          starter_code: Json
          test_cases: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          difficulty?: string
          hidden_test_cases?: Json
          hints?: string[] | null
          id?: string
          starter_code?: Json
          test_cases?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          hidden_test_cases?: Json
          hints?: string[] | null
          id?: string
          starter_code?: Json
          test_cases?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coding_submissions: {
        Row: {
          code: string
          created_at: string
          execution_time_ms: number | null
          id: string
          language: string
          problem_id: string
          score: number | null
          status: string
          test_results: Json | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          language?: string
          problem_id: string
          score?: number | null
          status?: string
          test_results?: Json | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          language?: string
          problem_id?: string
          score?: number | null
          status?: string
          test_results?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_reports: {
        Row: {
          created_at: string
          detailed_feedback: string | null
          id: string
          overall_rating: number | null
          session_id: string
          strengths: string[] | null
          suggestions: string[] | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          created_at?: string
          detailed_feedback?: string | null
          id?: string
          overall_rating?: number | null
          session_id: string
          strengths?: string[] | null
          suggestions?: string[] | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          created_at?: string
          detailed_feedback?: string | null
          id?: string
          overall_rating?: number | null
          session_id?: string
          strengths?: string[] | null
          suggestions?: string[] | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          score: number | null
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          score?: number | null
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty: string
          domain: string
          feedback: string | null
          id: string
          overall_score: number | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          domain?: string
          feedback?: string | null
          id?: string
          overall_score?: number | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          domain?: string
          feedback?: string | null
          id?: string
          overall_score?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          company: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          recruiter_id: string
          requirements: string[] | null
          salary_range: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          recruiter_id: string
          requirements?: string[] | null
          salary_range?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          recruiter_id?: string
          requirements?: string[] | null
          salary_range?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      practice_progress: {
        Row: {
          category: string
          correct_answers: number | null
          created_at: string
          id: string
          last_practiced: string | null
          questions_attempted: number | null
          user_id: string
        }
        Insert: {
          category: string
          correct_answers?: number | null
          created_at?: string
          id?: string
          last_practiced?: string | null
          questions_attempted?: number | null
          user_id: string
        }
        Update: {
          category?: string
          correct_answers?: number | null
          created_at?: string
          id?: string
          last_practiced?: string | null
          questions_attempted?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          college: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          graduation_year: number | null
          id: string
          phone: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_primary: boolean | null
          resume_data: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          resume_data?: Json | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          resume_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "student" | "recruiter" | "admin"
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
      app_role: ["student", "recruiter", "admin"],
    },
  },
} as const
