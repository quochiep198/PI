import type { StreakData, CheckInResult } from '../types/streak';

const API_BASE = '/api/streak';

function generateWeekDays(checkedInDates: string[]): StreakData['weekDays'] {
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === today.toISOString().split('T')[0];
    const isFuture = date > today;

    const isCompleted = checkedInDates.includes(dateStr);
    const dayIndex = date.getDay();

    days.push({
      date: dateStr,
      label: dayLabels[dayIndex],
      status: isCompleted
        ? 'completed'
        : isToday
          ? 'today'
          : isFuture
            ? 'future'
            : 'locked',
      isToday,
      dayOfWeek: dayIndex,
    });
  }

  return days as StreakData['weekDays'];
}

const mockStreakData: StreakData = {
  currentStreak: 12,
  longestStreak: 45,
  lastCheckIn: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  weekDays: generateWeekDays([
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  ]),
  totalCheckIns: 87,
  isCheckedInToday: false,
};

let currentMockData = { ...mockStreakData };

export async function fetchStreakData(userId: number): Promise<StreakData> {
  try {
    const response = await fetch(`${API_BASE}/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch {
    await new Promise(resolve => setTimeout(resolve, 300));
    currentMockData.weekDays = generateWeekDays(
      currentMockData.weekDays
        .filter(d => d.status === 'completed')
        .map(d => d.date)
    );
    return currentMockData;
  }
}

export async function checkIn(userId: number): Promise<CheckInResult> {
  try {
    const response = await fetch(`${API_BASE}/${userId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch {
    await new Promise(resolve => setTimeout(resolve, 500));

    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyCheckedIn = currentMockData.weekDays.some(
      d => d.date === todayStr && d.status === 'completed'
    );

    if (alreadyCheckedIn) {
      return {
        success: false,
        newStreak: currentMockData.currentStreak,
        reward: 0,
        message: 'Bạn đã check-in hôm nay rồi!',
      };
    }

    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const yesterdayCompleted = currentMockData.weekDays.some(
      d => d.date === yesterdayStr && d.status === 'completed'
    );

    let newStreak = currentMockData.currentStreak;

    if (yesterdayCompleted || currentMockData.currentStreak === 0) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const completedDates = currentMockData.weekDays
      .filter(d => d.status === 'completed')
      .map(d => d.date);
    completedDates.push(todayStr);
    currentMockData.weekDays = generateWeekDays(completedDates);
    currentMockData.currentStreak = newStreak;
    currentMockData.lastCheckIn = todayStr;
    currentMockData.isCheckedInToday = true;
    currentMockData.totalCheckIns += 1;

    const milestoneAchievements: Record<number, string> = {
      7: 'Tuần lễ đầu tiên!',
      14: 'Hai tuần kiên trì!',
      30: 'Một tháng champion!',
      100: '100 ngày huyền thoại!',
    };

    const reward = 10 + newStreak * 2;
    let achievement: string | undefined;

    if (milestoneAchievements[newStreak]) {
      achievement = milestoneAchievements[newStreak];
    }

    return {
      success: true,
      newStreak,
      reward,
      achievement,
      message: achievement || `+${reward} coins! Tiếp tục giữ vững phong độ!`,
    };
  }
}

export function resetMockData(): void {
  currentMockData = { ...mockStreakData };
  currentMockData.weekDays = generateWeekDays([
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  ]);
}