export type SubscriptionStatus = "pending" | "active" | "expired" | "rejected" | "banned";
export type UtrStatus = "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";
export type PathType = "intermediate" | "btech";
export type IntermediateBranch = "MPC" | "BiPC";
export type BtechBranch = "CSE" | "AIML" | "DS" | "ECE" | "EEE" | "MECH" | "CIVIL";
export type Branch = IntermediateBranch | BtechBranch;

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
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
}

export interface UtrLog {
  id: string;
  user_id: string;
  utr_number: string;
  plan_amount: number;
  status: UtrStatus;
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

/**
 * Full Supabase Database type. Includes Tables, Views, Functions, Enums,
 * and CompositeTypes - the typed client (@supabase/supabase-js v2.45+)
 * requires this full shape, otherwise queries collapse to `never` and
 * RPCs reject their args as `undefined`.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      utr_logs: {
        Row: UtrLog;
        Insert: Partial<UtrLog>;
        Update: Partial<UtrLog>;
        Relationships: [];
      };
      progress_logs: {
        Row: ProgressLog;
        Insert: Partial<ProgressLog>;
        Update: Partial<ProgressLog>;
        Relationships: [];
      };
      user_progress: {
        Row: UserProgress;
        Insert: Partial<UserProgress>;
        Update: Partial<UserProgress>;
        Relationships: [];
      };
      streaks: {
        Row: Streak;
        Insert: Partial<Streak>;
        Update: Partial<Streak>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      approve_utr: {
        Args: { p_utr_id: string };
        Returns: void;
      };
      reject_utr: {
        Args: { p_utr_id: string };
        Returns: void;
      };
      ban_user: {
        Args: { p_user_id: string };
        Returns: void;
      };
      reset_progress: {
        Args: { p_user_id: string };
        Returns: void;
      };
      complete_day: {
        Args: { p_day: number };
        Returns: { current_streak: number; longest_streak: number };
      };
      reset_stale_streak: {
        Args: Record<string, never>;
        Returns: { was_reset: boolean; current_streak: number; longest_streak: number };
      };
      touch_expiry: {
        Args: { uid: string };
        Returns: void;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      subscription_status_t: SubscriptionStatus;
      utr_status_t: UtrStatus;
      user_role_t: UserRole;
      path_type_t: PathType;
    };
    CompositeTypes: Record<string, never>;
  };
}
