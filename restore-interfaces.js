const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/kaizen-sys/src/components/SenseiVerificationDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const interfacesToAdd = `export interface SenseiUserRecord {
  user_id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  joined_at: string | null;
  last_active_at?: string | null;
  path_type: string | null;
  branch: string | null;
  occupation: string | null;
  field_of_study: string | null;
  daily_time_min: number | null;
  skill_level: string | null;
  main_goal: string | null;
  main_goal_other: string | null;
  workout_location: string | null;
  fitness_level: string | null;
  age: number | null;
  gender: string | null;
  is_suspended?: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  completed_days: number;
  current_roadmap_day: number;
  progress_percent: number;
  latest_activity_at: string | null;
  subscription_status: string | null;
  expiry_date: string | null;
  plan_amount: number | null;
  latest_payment_status: string | null;
  latest_utr_id: string | null;
  latest_utr_number: string | null;
  latest_payment_created_at: string | null;
  latest_rejection_reason: string | null;
  payment_history: SenseiPaymentHistoryEntry[];
  ai_track_label: string | null;
  ai_track_id: string | null;
  onboarding_raw: unknown;
  reviewable: boolean;
}

export interface SenseiDashboardStats {
  pendingApprovals: number;
  activeSubscribers: number;
  totalRevenue: number;
  expiringSoon: number;
  totalUsers: number;
  monthlyGrowth: number;
  consistencyRate: number;
  suspendedUsers?: number;
}

export interface SenseiChartPoint {
  label: string;
  value: number;
}`;

const searchTarget = '  rejection_reason: string | null;\n}';
const searchTarget2 = '  rejection_reason: string | null;\r\n}';
if (code.includes(searchTarget)) {
  code = code.replace(searchTarget, searchTarget + '\n\n' + interfacesToAdd);
  fs.writeFileSync(file, code);
  console.log('Restored interfaces successfully.');
} else if (code.includes(searchTarget2)) {
  code = code.replace(searchTarget2, searchTarget2 + '\n\n' + interfacesToAdd);
  fs.writeFileSync(file, code);
  console.log('Restored interfaces successfully.');
} else {
  console.log('Could not find injection point!');
}
