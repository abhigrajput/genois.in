export const STREAK_REWARDS = [
  { day: 3, type: 'points', value: 50, label: '+50 bonus points', icon: '🔥' },
  { day: 7, type: 'badge', value: 'Week Warrior', label: 'Week Warrior badge', icon: '🏅' },
  { day: 14, type: 'points', value: 200, label: '+200 bonus points', icon: '💎' },
  { day: 21, type: 'badge', value: 'Habit Builder', label: 'Habit Builder badge', icon: '⚡' },
  { day: 30, type: 'points', value: 500, label: '+500 bonus points + Discount', icon: '🚀' },
  { day: 50, type: 'badge', value: 'Half Century', label: 'Half Century badge', icon: '👑' },
  { day: 75, type: 'points', value: 1000, label: '+1000 bonus points', icon: '💰' },
  { day: 100, type: 'badge', value: 'Centurion', label: 'Centurion badge + 1 month free', icon: '🏆' },
];

export function getNextReward(currentStreak) {
  return STREAK_REWARDS.find(r => r.day > currentStreak);
}

export function getUnclaimedRewards(currentStreak, lastClaimedStreak) {
  return STREAK_REWARDS.filter(r => r.day <= currentStreak && r.day > (lastClaimedStreak || 0));
}
