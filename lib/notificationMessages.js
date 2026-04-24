export const MORNING_MESSAGES = [
  { icon: '🔥', title: 'Day {day} is live', message: 'Your rivals started at 6 AM. Catch up.' },
  { icon: '⚡', title: 'Morning grind time', message: 'Today beats yesterday. No excuses.' },
  { icon: '🏆', title: 'Rank #{rank} checking in', message: '5 tasks today. All of them. Let us go.' },
  { icon: '🎯', title: '{streak} day streak on the line', message: 'Do not break it today.' },
  { icon: '🚀', title: 'Good morning {name}', message: 'Your future self is counting on today.' },
  { icon: '💪', title: 'Grinders are up', message: 'Top 10 already completed Day {day}. Where are you?' },
];

export const EVENING_MESSAGES = [
  { icon: '⚠️', title: '3 hours until day resets', message: 'You have not finished Day {day}. Move now.' },
  { icon: '🔥', title: 'Last call for today', message: 'Streak breaks at midnight. Finish your tasks.' },
  { icon: '📊', title: 'Check your rank', message: 'You dropped 3 positions today. Grind back up.' },
  { icon: '💀', title: 'Shame board is watching', message: 'Miss tomorrow and your name goes up.' },
  { icon: '🎯', title: 'One task left', message: 'Complete it in 10 minutes. Keep your streak.' },
];

export const ACHIEVEMENT_MESSAGES = [
  { icon: '🏆', title: 'New rank unlocked', message: 'You just hit #{rank}! Keep pushing.' },
  { icon: '🎉', title: 'Streak milestone', message: '{streak} days in a row! You are officially serious.' },
  { icon: '⚡', title: 'Badge earned', message: 'New skill verified. Company recruiters can see it now.' },
  { icon: '🔥', title: 'Score jumped', message: '+{points} points earned today. You are {tier} now.' },
];

export const REMINDER_MESSAGES = [
  { icon: '📚', title: 'Weekly test ready', message: 'Score 100% to earn a streak insurance token.' },
  { icon: '🎯', title: 'Interview this week?', message: 'Take one mock interview before they call.' },
  { icon: '💼', title: 'Company viewed your profile', message: 'Complete your portfolio now to convert.' },
  { icon: '🚀', title: 'Test your skills', message: 'Renew your Bronze badge before it expires.' },
];

export function pickMessage(type, context) {
  const lists = {
    morning: MORNING_MESSAGES,
    evening: EVENING_MESSAGES,
    achievement: ACHIEVEMENT_MESSAGES,
    reminder: REMINDER_MESSAGES,
  };
  const list = lists[type] || MORNING_MESSAGES;
  const template = list[Math.floor(Math.random() * list.length)];
  return {
    icon: template.icon,
    title: template.title
      .replace('{day}', context.day || 1)
      .replace('{rank}', context.rank || 1)
      .replace('{streak}', context.streak || 0)
      .replace('{name}', context.name || 'Student')
      .replace('{points}', context.points || 0)
      .replace('{tier}', context.tier || 'ranked'),
    message: template.message
      .replace('{day}', context.day || 1)
      .replace('{rank}', context.rank || 1)
      .replace('{streak}', context.streak || 0)
      .replace('{name}', context.name || 'Student')
      .replace('{points}', context.points || 0)
      .replace('{tier}', context.tier || 'ranked'),
  };
}
