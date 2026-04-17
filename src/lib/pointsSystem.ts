/**
 * Wine Gallery — Points System
 * Central module for all point-earning actions.
 * Called anywhere user interaction earns points.
 */

import { supabase } from './supabase';
import { ACTION_POINTS, getLevelForPoints, getNextProfile, type WineProfile } from './profileConstants';

type ActionType = 'tried' | 'favorite' | 'review' | 'photo' | 'brotherhood_join' | 'follow';

interface AwardPointsOptions {
  userId: string;
  action: ActionType;
  itemId?: string;
  itemType?: string;
  /** profile_affinity of the item being consumed (for profile upgrade check) */
  itemProfile?: WineProfile;
}

interface AwardResult {
  pointsEarned: number;
  newTotal: number;
  levelChanged: boolean;
  profileChanged: boolean;
  newProfile?: WineProfile;
}

/**
 * Award points to a user for an action.
 * - Logs the action to user_points_log
 * - Updates total_points + user_level in user_profiles
 * - Checks if profile should upgrade (5 items of next profile = upgrade)
 */
export async function awardPoints(opts: AwardPointsOptions): Promise<AwardResult | null> {
  const { userId, action, itemId, itemType, itemProfile } = opts;
  const pts = ACTION_POINTS[action] ?? 0;

  if (pts <= 0) return null;

  // 1. Log the action
  const { error: logErr } = await supabase
    .from('user_points_log')
    .insert({
      user_id:     userId,
      action_type: action,
      item_id:     itemId ?? null,
      item_type:   itemType ?? null,
      points:      pts,
    });

  if (logErr) {
    console.error('[awardPoints] log error:', logErr.message);
    return null;
  }

  // 2. Fetch current profile state
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_points, user_level, wine_profile, next_profile_count')
    .eq('user_id', userId)
    .single();

  if (!profile) return null;

  const newTotal = (profile.total_points ?? 0) + pts;
  const newLevel = getLevelForPoints(newTotal);
  const levelChanged = newLevel !== profile.user_level;

  // 3. Check profile upgrade
  let profileChanged = false;
  let newProfile: WineProfile | undefined;
  let newNextCount = profile.next_profile_count ?? 0;

  const currentProfile = profile.wine_profile as WineProfile;
  const nextProfile    = getNextProfile(currentProfile);

  if (nextProfile && itemProfile === nextProfile && action === 'tried') {
    newNextCount = (profile.next_profile_count ?? 0) + 1;

    // Fetch threshold from app_settings
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'profile_upgrade_threshold')
      .single();

    const threshold = parseInt(setting?.value ?? '5', 10);

    if (newNextCount >= threshold) {
      profileChanged = true;
      newProfile     = nextProfile;
      newNextCount   = 0; // reset counter after upgrade
    }
  }

  // 4. Update user_profiles
  const updatePayload: Record<string, unknown> = {
    total_points:      newTotal,
    user_level:        newLevel,
    next_profile_count: newNextCount,
  };

  if (profileChanged && newProfile) {
    updatePayload.wine_profile = newProfile;
  }

  await supabase
    .from('user_profiles')
    .update(updatePayload)
    .eq('user_id', userId);

  return { pointsEarned: pts, newTotal, levelChanged, profileChanged, newProfile };
}

/**
 * Convenience: toggle "tried" state and award/remove points accordingly.
 * Returns the new isTried state.
 */
export async function toggleTried(
  userId: string,
  itemId: string,
  itemType: string,
  currentlyTried: boolean,
  itemProfile?: WineProfile,
): Promise<boolean> {
  if (currentlyTried) {
    // Remove from user_progress — no point deduction (points are not revoked)
    await supabase
      .from('user_progress')
      .update({ completed: false })
      .eq('user_id', userId)
      .eq('item_id', itemId);
    return false;
  } else {
    // Upsert user_progress
    await supabase
      .from('user_progress')
      .upsert({ user_id: userId, item_id: itemId, item_type: itemType, completed: true, is_favorite: false }, { onConflict: 'user_id,item_id' });

    // Award points
    await awardPoints({ userId, action: 'tried', itemId, itemType, itemProfile });
    return true;
  }
}

/**
 * Convenience: toggle "favorite" state and award points.
 */
export async function toggleFavorite(
  userId: string,
  itemId: string,
  itemType: string,
  currentlyFav: boolean,
): Promise<boolean> {
  if (currentlyFav) {
    await supabase
      .from('user_progress')
      .update({ is_favorite: false })
      .eq('user_id', userId)
      .eq('item_id', itemId);
    return false;
  } else {
    await supabase
      .from('user_progress')
      .upsert({ user_id: userId, item_id: itemId, item_type: itemType, completed: false, is_favorite: true }, { onConflict: 'user_id,item_id' });
    await awardPoints({ userId, action: 'favorite', itemId, itemType });
    return true;
  }
}
