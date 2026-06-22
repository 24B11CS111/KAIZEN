import { createSupabaseServerClient } from "./supabase/server";

export type SubscriptionTier = 'trial' | 'ronin' | 'shogun' | 'expired';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isExpired: boolean;
  daysRemaining: number;
}

export async function getUserSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { tier: 'expired', isExpired: true, daysRemaining: 0 };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier, trial_expires_at')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return { tier: 'expired', isExpired: true, daysRemaining: 0 };
  }

  const tier = (data.subscription_tier as SubscriptionTier) || 'trial';
  
  // If user is explicitly expired, ronin, or shogun, no need for trial calc
  if (tier === 'expired') return { tier, isExpired: true, daysRemaining: 0 };
  if (tier === 'ronin' || tier === 'shogun') return { tier, isExpired: false, daysRemaining: 999 };

  // Trial logic
  if (!data.trial_expires_at) {
    // Edge case: trial started but no expiry set, let's assume they have 3 days
    return { tier: 'trial', isExpired: false, daysRemaining: 3 };
  }

  const expiresAt = new Date(data.trial_expires_at);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffTime <= 0) {
    return { tier: 'expired', isExpired: true, daysRemaining: 0 };
  }

  return { tier: 'trial', isExpired: false, daysRemaining: diffDays };
}
