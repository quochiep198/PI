import { useState, useCallback, type FC } from 'react';
import { useStreak } from '../hooks/useStreak';
import { DayCell } from './DayCell';
import { CelebrationModal } from './CelebrationModal';
import type { CheckInResult } from '../types/streak';

type StreakCalendarProps = {
  userId: number;
};

export const StreakCalendar: FC<StreakCalendarProps> = ({ userId }) => {
  const { streakData, state, error, checkIn } = useStreak(userId);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CheckInResult | null>(null);

  const handleCheckIn = useCallback(async () => {
    if (isCheckingIn || streakData?.isCheckedInToday) return;

    setIsCheckingIn(true);

    try {
      const result = await checkIn();

      if (result?.success) {
        setCelebrationData(result);
        setShowCelebration(true);
      }
    } finally {
      setIsCheckingIn(false);
    }
  }, [checkIn, isCheckingIn, streakData?.isCheckedInToday]);

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
  }, []);

  if (state === 'loading' && !streakData) {
    return (
      <section className="practice-streak">
        <div className="practice-streak__header">
          <h2 className="practice-streak__title">Chuỗi ngày rực rỡ</h2>
        </div>
        <div className="practice-streak__loading">
          <div className="practice-streak__loading-spinner" />
          <span>Đang tải...</span>
        </div>
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section className="practice-streak">
        <div className="practice-streak__header">
          <h2 className="practice-streak__title">Chuỗi ngày rực rỡ</h2>
        </div>
        <div className="practice-streak__error">
          <span className="material-symbols-outlined">error</span>
          <p>{error}</p>
          <button
            type="button"
            className="pressable practice-streak__retry"
            onClick={() => void checkIn()}
          >
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  if (!streakData) {
    return null;
  }

  const currentStreak = streakData.currentStreak;
  const isAnimating = isCheckingIn;
  const isCheckedInToday = streakData.isCheckedInToday;

  return (
    <>
      <section className="practice-streak">
        <div className="practice-streak__header">
          <h2 className="practice-streak__title">Chuỗi ngày rực rỡ</h2>
          <div className={`practice-streak__badge ${isAnimating ? 'is-checking-in' : ''}`}>
            <span className={`material-symbols-outlined practice-streak__fire ${currentStreak >= 7 ? 'streak-fire' : ''}`}>
              local_fire_department
            </span>
            <span>
              {state === 'loading' && isCheckingIn
                ? 'Đang check-in...'
                : `${currentStreak} Ngày`}
            </span>
          </div>
        </div>

        <div className="practice-streak__calendar" role="grid" aria-label="Lịch streak tuần">
          {streakData.weekDays.map((day, index) => (
            <DayCell
              key={day.date}
              day={day}
              onClick={day.isToday && !isCheckedInToday ? handleCheckIn : undefined}
              isCheckInDisabled={isCheckingIn || isCheckedInToday}
            />
          ))}
        </div>

        {!isCheckedInToday && (
          <div className="practice-streak__cta">
            <button
              type="button"
              className={`practice-streak__checkin-btn pressable ${isCheckingIn ? 'is-loading' : ''}`}
              onClick={handleCheckIn}
              disabled={isCheckingIn}
            >
              {isCheckingIn ? (
                <>
                  <span className="practice-streak__checkin-spinner" />
                  Đang check-in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                  Check-in hôm nay
                </>
              )}
            </button>
          </div>
        )}

        {isCheckedInToday && (
          <div className="practice-streak__completed">
            <span className="material-symbols-outlined practice-streak__completed-icon">
              verified
            </span>
            <span>Đã check-in hôm nay! Tiếp tục giữ vững!</span>
          </div>
        )}

        <div className="practice-streak__info">
          <div className="practice-streak__info-item">
            <span className="material-symbols-outlined practice-streak__info-icon">
              emoji_events
            </span>
            <span>Streak dài nhất: {streakData.longestStreak} ngày</span>
          </div>
          <div className="practice-streak__info-item">
            <span className="material-symbols-outlined practice-streak__info-icon">
              numbers
            </span>
            <span>Tổng check-in: {streakData.totalCheckIns} ngày</span>
          </div>
        </div>
      </section>

      <CelebrationModal
        isOpen={showCelebration}
        streak={celebrationData?.newStreak ?? currentStreak}
        reward={celebrationData?.reward ?? 0}
        achievement={celebrationData?.achievement}
        onClose={handleCloseCelebration}
      />
    </>
  );
};