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
      classroom_occupancy: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          class_name: string
          classroom_id: string | null
          created_at: string | null
          end_time: string
          id: string
          occupied_by: string | null
          purpose: string | null
          start_time: string
          status: Database["public"]["Enums"]["classroom_status"]
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          branch: Database["public"]["Enums"]["branch_type"]
          class_name: string
          classroom_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          occupied_by?: string | null
          purpose?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["classroom_status"]
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          class_name?: string
          classroom_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          occupied_by?: string | null
          purpose?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["classroom_status"]
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_occupancy_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_occupancy_occupied_by_fkey"
            columns: ["occupied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          building: string
          capacity: number
          created_at: string | null
          floor: string
          id: string
          room_number: string
        }
        Insert: {
          building: string
          capacity: number
          created_at?: string | null
          floor: string
          id?: string
          room_number: string
        }
        Update: {
          building?: string
          capacity?: number
          created_at?: string | null
          floor?: string
          id?: string
          room_number?: string
        }
        Relationships: []
      }
      cr_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sender_branch: Database["public"]["Enums"]["branch_type"]
          sender_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sender_branch: Database["public"]["Enums"]["branch_type"]
          sender_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sender_branch?: Database["public"]["Enums"]["branch_type"]
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cr_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_codes: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          code: string
          created_at: string | null
          id: string
        }
        Insert: {
          branch: Database["public"]["Enums"]["branch_type"]
          code: string
          created_at?: string | null
          id?: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          code?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          cr_code: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          branch: Database["public"]["Enums"]["branch_type"]
          cr_code?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          cr_code?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      room_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requester_branch: Database["public"]["Enums"]["branch_type"]
          requester_id: string
          requester_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requester_branch: Database["public"]["Enums"]["branch_type"]
          requester_id: string
          requester_name: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requester_branch?: Database["public"]["Enums"]["branch_type"]
          requester_id?: string
          requester_name?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"]
          class_name: string
          classroom_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          subject: string
        }
        Insert: {
          branch: Database["public"]["Enums"]["branch_type"]
          class_name: string
          classroom_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          subject: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"]
          class_name?: string
          classroom_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
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
      branch_type: "CSE" | "ECE" | "IT" | "MECH" | "CIVIL" | "EEE"
      classroom_status: "vacant" | "occupied" | "reserved"
      user_role: "student" | "cr" | "admin"
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
      branch_type: ["CSE", "ECE", "IT", "MECH", "CIVIL", "EEE"],
      classroom_status: ["vacant", "occupied", "reserved"],
      user_role: ["student", "cr", "admin"],
    },
  },
} as const
