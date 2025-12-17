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
      game_results: {
        Row: {
          created_at: string
          distance: number
          id: string
          lobby_id: string | null
          placement: number
          profile_id: string
          score: number
          seed: number
        }
        Insert: {
          created_at?: string
          distance?: number
          id?: string
          lobby_id?: string | null
          placement?: number
          profile_id: string
          score?: number
          seed: number
        }
        Update: {
          created_at?: string
          distance?: number
          id?: string
          lobby_id?: string | null
          placement?: number
          profile_id?: string
          score?: number
          seed?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_results_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lobbies: {
        Row: {
          created_at: string
          finished_at: string | null
          host_id: string
          id: string
          max_players: number
          room_code: string | null
          seed: number
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          host_id: string
          id?: string
          max_players?: number
          room_code?: string | null
          seed?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          host_id?: string
          id?: string
          max_players?: number
          room_code?: string | null
          seed?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobbies_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_players: {
        Row: {
          id: string
          is_host: boolean
          is_ready: boolean
          joined_at: string
          lobby_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string
          lobby_id: string
          profile_id: string
        }
        Update: {
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string
          lobby_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_players_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          average_distance: number
          best_distance: number
          coins: number
          created_at: string
          id: string
          is_guest: boolean
          session_id: string | null
          skin: string
          total_matches: number
          total_playtime: number
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          average_distance?: number
          best_distance?: number
          coins?: number
          created_at?: string
          id?: string
          is_guest?: boolean
          session_id?: string | null
          skin?: string
          total_matches?: number
          total_playtime?: number
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          average_distance?: number
          best_distance?: number
          coins?: number
          created_at?: string
          id?: string
          is_guest?: boolean
          session_id?: string | null
          skin?: string
          total_matches?: number
          total_playtime?: number
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      skins: {
        Row: {
          available_from: string | null
          available_until: string | null
          created_at: string
          description: string | null
          id: string
          is_premium: boolean
          is_seasonal: boolean
          name: string
          price: number
          rarity: string
          season_name: string | null
          skin_key: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          is_seasonal?: boolean
          name: string
          price?: number
          rarity?: string
          season_name?: string | null
          skin_key: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          is_seasonal?: boolean
          name?: string
          price?: number
          rarity?: string
          season_name?: string | null
          skin_key?: string
        }
        Relationships: []
      }
      user_skins: {
        Row: {
          id: string
          profile_id: string
          purchased_at: string
          skin_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          purchased_at?: string
          skin_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          purchased_at?: string
          skin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_coins: {
        Args: { p_distance: number; p_profile_id: string }
        Returns: number
      }
      find_or_create_guest_profile: {
        Args: { p_session_id: string; p_skin?: string; p_username: string }
        Returns: string
      }
      get_leaderboard: {
        Args: { limit_count?: number; time_filter?: string }
        Returns: {
          best_distance: number
          profile_id: string
          rank: number
          skin: string
          total_matches: number
          username: string
        }[]
      }
      purchase_skin: {
        Args: { p_profile_id: string; p_skin_id: string }
        Returns: Json
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
