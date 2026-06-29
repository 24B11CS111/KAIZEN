// ─────────────────────────────────────────────────────────────────────────────
// Convenience type aliases (used throughout the app)
// ─────────────────────────────────────────────────────────────────────────────
export type SubscriptionStatus = "pending" | "active" | "expired" | "rejected" | "banned";
export type UtrStatus = "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";
export type PathType = "intermediate" | "btech";
export type IntermediateBranch = "MPC" | "BiPC";
export type BtechBranch = "CSE" | "AIML" | "DS" | "ECE" | "EEE" | "MECH" | "CIVIL";
export type Branch = IntermediateBranch | BtechBranch;

// ─────────────────────────────────────────────────────────────────────────────
// Plain interfaces used by components / non-Supabase code
// ─────────────────────────────────────────────────────────────────────────────
export type SubscriptionTier = "trial" | "ronin" | "shogun" | "expired";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  is_suspended: boolean;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier;
  plan_amount: number | null;
  start_date: string | null;
  expiry_date: string | null;
  trial_expires_at: string | null;
  whatsapp: string | null;
  full_name: string | null;
  path_type: PathType | null;
  branch: Branch | null;
  created_at: string;
  updated_at: string;
}

export interface UtrLog {
  id: string;
  user_id: string;
  utr_number: string;
  plan_amount: number;
  status: UtrStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface ProgressLog {
  id: string;
  user_id: string;
  day_number: number;
  completed: boolean;
  completed_at: string | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  day: number;
  completed: boolean;
  completed_at: string;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Supabase Database type
//
// IMPORTANT shape rules for @supabase/supabase-js v2.45+:
//   * Views / CompositeTypes must use { [_ in never]: never } — NOT
//     Record<string, never>.  The mapped-type form satisfies GenericSchema
//     while the index-signature form collapses Schema to `never`.
//   * Insert / Update must use explicit `field?: type` syntax — NOT Partial<T>.
//   * Functions returning nothing use Returns: undefined (not void).
//   * server.ts must explicitly annotate its return type as
//     SupabaseClient<Database> to work around a @supabase/ssr v0.5.x /
//     supabase-js v2.45+ generic-parameter-order mismatch.
// ─────────────────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      daily_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          priority: "Low" | "Medium" | "High";
          duration: number;
          completed: boolean;
          type: "ai" | "manual";
          day_number: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          priority?: "Low" | "Medium" | "High";
          duration?: number;
          completed?: boolean;
          type: "ai" | "manual";
          day_number: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          notes?: string | null;
          priority?: "Low" | "Medium" | "High";
          duration?: number;
          completed?: boolean;
          type?: "ai" | "manual";
          day_number?: number;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          is_admin: boolean;
          is_suspended: boolean;
          subscription_status: SubscriptionStatus;
          plan_amount: number | null;
          start_date: string | null;
          expiry_date: string | null;
          whatsapp: string | null;
          full_name: string | null;
          path_type: PathType | null;
          branch: Branch | null;
          created_at: string;
          updated_at: string;
          onboarded_at: string | null;
          age: number | null;
          gender: string | null;
          occupation: string | null;
          field_of_study: string | null;
          daily_time_min: number | null;
          skill_level: string | null;
          main_goal: string | null;
          main_goal_other: string | null;
          wake_time: string | null;
          sleep_time: string | null;
          available_hours: number | null;
          discipline_level: string | null;
          workout_preference: string | null;
          energy_level: string | null;
          study_timing: string | null;
          work_type: string | null;
          distractions: string | null;
          skills_to_learn: string | null;
        };
        Insert: {
          id?: string;
          email?: string;
          role?: UserRole;
          is_admin?: boolean;
          is_suspended?: boolean;
          subscription_status?: SubscriptionStatus;
          plan_amount?: number | null;
          start_date?: string | null;
          expiry_date?: string | null;
          whatsapp?: string | null;
          full_name?: string | null;
          path_type?: PathType | null;
          branch?: Branch | null;
          created_at?: string;
          updated_at?: string;
          onboarded_at?: string | null;
          age?: number | null;
          gender?: string | null;
          occupation?: string | null;
          field_of_study?: string | null;
          daily_time_min?: number | null;
          skill_level?: string | null;
          main_goal?: string | null;
          main_goal_other?: string | null;
          wake_time?: string | null;
          sleep_time?: string | null;
          available_hours?: number | null;
          discipline_level?: string | null;
          workout_preference?: string | null;
          energy_level?: string | null;
          study_timing?: string | null;
          work_type?: string | null;
          distractions?: string | null;
          skills_to_learn?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          is_admin?: boolean;
          is_suspended?: boolean;
          subscription_status?: SubscriptionStatus;
          plan_amount?: number | null;
          start_date?: string | null;
          expiry_date?: string | null;
          whatsapp?: string | null;
          full_name?: string | null;
          path_type?: PathType | null;
          branch?: Branch | null;
          created_at?: string;
          updated_at?: string;
          onboarded_at?: string | null;
          age?: number | null;
          gender?: string | null;
          occupation?: string | null;
          field_of_study?: string | null;
          daily_time_min?: number | null;
          skill_level?: string | null;
          main_goal?: string | null;
          main_goal_other?: string | null;
          wake_time?: string | null;
          sleep_time?: string | null;
          available_hours?: number | null;
          discipline_level?: string | null;
          workout_preference?: string | null;
          energy_level?: string | null;
          study_timing?: string | null;
          work_type?: string | null;
          distractions?: string | null;
          skills_to_learn?: string | null;
        };
        Relationships: [];
      };
      utr_logs: {
        Row: {
          id: string;
          user_id: string;
          utr_number: string;
          plan_amount: number;
          status: UtrStatus;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          utr_number?: string;
          plan_amount?: number;
          status?: UtrStatus;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          utr_number?: string;
          plan_amount?: number;
          status?: UtrStatus;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_submissions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          amount: number;
          transaction_id: string | null;
          payment_screenshot: string | null;
          status: string;
          created_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: string;
          amount: number;
          transaction_id?: string | null;
          payment_screenshot?: string | null;
          status?: string;
          created_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          amount?: number;
          transaction_id?: string | null;
          payment_screenshot?: string | null;
          status?: string;
          created_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      progress_logs: {
        Row: {
          id: string;
          user_id: string;
          day_number: number;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          day_number?: number;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_number?: number;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          day: number;
          completed: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          day?: number;
          completed?: boolean;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day?: number;
          completed?: boolean;
          completed_at?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_completed_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_plans: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          track_label: string;
          generated_plan: unknown;
          source: unknown;
          version: number;
          created_at: string;
          prompt_used: string | null;
          llm_response_raw: unknown;
          generation_model: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          track_id?: string;
          track_label?: string;
          generated_plan?: unknown;
          source?: unknown;
          version?: number;
          created_at?: string;
          prompt_used?: string | null;
          llm_response_raw?: unknown;
          generation_model?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string;
          track_label?: string;
          generated_plan?: unknown;
          source?: unknown;
          version?: number;
          created_at?: string;
          prompt_used?: string | null;
          llm_response_raw?: unknown;
          generation_model?: string | null;
        };
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          user_id: string;
          mood: string;
          energy: string;
          completion_percentage: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood: string;
          energy: string;
          completion_percentage: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood?: string;
          energy?: string;
          completion_percentage?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      onboarding_data: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          age: number | null;
          gender: string | null;
          occupation: string | null;
          field_of_study: string | null;
          daily_time_min: number | null;
          skill_level: string | null;
          main_goal: string | null;
          main_goal_other: string | null;
          source: string | null;
          raw: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          age?: number | null;
          gender?: string | null;
          occupation?: string | null;
          field_of_study?: string | null;
          daily_time_min?: number | null;
          skill_level?: string | null;
          main_goal?: string | null;
          main_goal_other?: string | null;
          source?: string | null;
          raw?: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          age?: number | null;
          gender?: string | null;
          occupation?: string | null;
          field_of_study?: string | null;
          daily_time_min?: number | null;
          skill_level?: string | null;
          main_goal?: string | null;
          main_goal_other?: string | null;
          source?: string | null;
          raw?: unknown;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          day: number;
          completed: boolean;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          day?: number;
          completed?: boolean;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day?: number;
          completed?: boolean;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_utr: {
        Args: { p_utr_id: string };
        Returns: undefined;
      };
      reject_utr: {
        Args: { p_utr_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      ban_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      reset_progress: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      complete_day: {
        Args: { p_day: number; p_notes?: string | null };
        Returns: { current_streak: number; longest_streak: number; current_day?: number };
      };
      reset_stale_streak: {
        Args: Record<PropertyKey, never>;
        Returns: { was_reset: boolean; current_streak: number; longest_streak: number };
      };
      touch_expiry: {
        Args: { uid: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      subscription_status_t: SubscriptionStatus;
      utr_status_t: UtrStatus;
      user_role_t: UserRole;
      path_type_t: PathType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
