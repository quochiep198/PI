import { useEffect, useRef, useState } from 'react';
import type { AuthUser } from '../auth/types';
import { Leaderboard } from './components/Leaderboard';
import { StreakCalendar } from './components/StreakCalendar';
import { ChallengeCard } from './components/ChallengeCard';
import { ChallengeWorkspace } from './components/ChallengeWorkspace';
import { useChallenges } from './hooks/useChallenges';
import type { Challenge } from './types/challenge';
import { playCelebrationChime } from '../shared/soundEffects';

type PracticePageProps = {
  user: AuthUser;
  onNavigateUpgrade?: () => void;
};

// const storeItems = [
//   { name: 'Theme Ocean', price: 120, image: 'OCEAN', featured: true },
//   { name: 'Avatar Ninja', price: 180, image: 'NINJA' },
//   { name: 'XP Boost 2x', price: 90, image: 'BOOST' },
// ];

export function PracticePage({ user, onNavigateUpgrade }: PracticePageProps) {
  const { challenges, loading, error, markCompleted } = useChallenges();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const previousCompletedChallengeCountRef = useRef<number | null>(null);
  const visibleChallengeCount = user.isPro ? 5 : 3;
  const visibleChallenges = challenges.slice(0, visibleChallengeCount);
  const hasLockedChallenges = !user.isPro && challenges.length > visibleChallengeCount;
  const completedChallengeCount = challenges.filter((challenge) => challenge.completed).length;

  useEffect(() => {
    if (previousCompletedChallengeCountRef.current === null) {
      previousCompletedChallengeCountRef.current = completedChallengeCount;
      return;
    }

    if (completedChallengeCount > previousCompletedChallengeCountRef.current) {
      playCelebrationChime({
        enabled: user.musicEnabled ?? true,
        volume: user.soundVolume ?? 80,
      });
    }

    previousCompletedChallengeCountRef.current = completedChallengeCount;
  }, [completedChallengeCount, user.musicEnabled, user.soundVolume]);

  const handleStartChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
  };

  const handleCloseWorkspace = () => {
    setActiveChallenge(null);
  };

  const handleChallengeComplete = (challengeId: number) => {
    markCompleted(challengeId);
  };

  return (
    <>
      <main className="practice-main">
        <div className="practice-content">
          <div className="practice-center">
            <StreakCalendar userId={user.id} />

            <section className="practice-challenges">
              <h2 className="practice-challenges__title">Thử thách hôm nay</h2>
              {loading && (
                <div className="practice-challenges__loading">
                  <span className="material-symbols-outlined animated-spin">progress_activity</span>
                  <p>Đang tải thử thách...</p>
                </div>
              )}
              {error && (
                <div className="practice-challenges__error">
                  <span className="material-symbols-outlined">error</span>
                  <p>{error}</p>
                </div>
              )}
              {!loading && !error && challenges.length === 0 && (
                <div className="practice-challenges__empty">
                  <span className="material-symbols-outlined">school</span>
                  <p>Hoàn thành các bài học để mở khóa thử thách!</p>
                </div>
              )}
              {!loading && !error && visibleChallenges.length > 0 && visibleChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onStart={handleStartChallenge}
                />
              ))}
              {!loading && !error && hasLockedChallenges ? (
                <div className="practice-challenges__upgrade">
                  <div className="practice-challenges__upgrade-copy">
                    <p className="practice-challenges__upgrade-title">Mở thêm thử thách Pro</p>
                    <p className="practice-challenges__upgrade-text">
                      Tài khoản thường chỉ xem được 3 thử thách mỗi ngày. Nâng cấp Pro để mở 5 thử thách và luyện tập nhiều hơn.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pressable practice-challenges__upgrade-btn"
                    onClick={onNavigateUpgrade}
                  >
                    Nâng cấp Pro
                  </button>
                </div>
              ) : null}
            </section>

            {/* <section className="practice-store">
            <div className="practice-store__header">
              <h2 className="practice-store__title">Đổi qua bằng coin</h2>
              <button type="button" className="practice-store__view-all">
                Xem tất cả
              </button>
            </div>

            <div className="practice-store__grid">
              {storeItems.map((item) => (
                <article
                  key={item.name}
                  className={`practice-store__item ${item.featured ? 'practice-store__item--featured' : ''}`}
                >
                  <div className="practice-store__item-image" aria-hidden="true">
                    <span>{item.image}</span>
                  </div>
                  {item.featured ? <span className="practice-store__item-badge">Moi</span> : null}
                  <h3 className="practice-store__item-name">{item.name}</h3>
                  <div className="practice-store__item-footer">
                    <span className="practice-store__item-price">
                      <span className="material-symbols-outlined">monetization_on</span>
                      {item.price}
                    </span>
                    <button type="button" className="practice-store__item-btn">
                      Doi
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section> */}
          </div>

          <aside className="practice-sidebar">
            <Leaderboard />

            <section className="practice-tip">
              <div className="practice-tip__icon">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <h2 className="practice-tip__title">Mẹo luyện tập</h2>
              <p className="practice-tip__content">
                Nếu bị mắc ở bài khó, hay tách bài toán thành các hàm nhỏ và kiểm tra từng phần
                bằng output đơn giản trước khi tối ưu.
              </p>
            </section>
          </aside>
        </div>
      </main>

      <ChallengeWorkspace
        challenge={activeChallenge}
        isOpen={activeChallenge !== null}
        onClose={handleCloseWorkspace}
        onComplete={handleChallengeComplete}
      />
    </>
  );
}
