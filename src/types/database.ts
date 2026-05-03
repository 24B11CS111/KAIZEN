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

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      utr_logs: { Row: UtrLog; Insert: Partial<UtrLog>; Update: Partial<UtrLog> };
      progress_logs: { Row: ProgressLog; Insert: Partial<ProgressLog>; Update: Partial<ProgressLog> };
      streaks: { Row: Streak; Insert: Partial<Streak>; Update: Partial<Streak> };
    };
  };
}
