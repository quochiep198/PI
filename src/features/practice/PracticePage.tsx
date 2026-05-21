import type { AuthUser } from '../auth/types';
import { Leaderboard } from './components/Leaderboard';
import { StreakCalendar } from './components/StreakCalendar';

type PracticePageProps = {
  user: AuthUser;
};

const challenges = [
  {
    name: 'Bot Tra Loi Nhanh',
    description: 'Viet ham xu ly tin nhan va tra ve cau tra loi phu hop.',
    difficulty: 'easy' as const,
    reward: 20,
    icon: 'smart_toy',
    iconClass: 'practice-challenge-card__icon--primary',
  },
  {
    name: 'Kho Bau Kim Cuong',
    description: 'Dung vong lap de tim duong di co tong diem cao nhat.',
    difficulty: 'medium' as const,
    reward: 35,
    icon: 'diamond',
    iconClass: 'practice-challenge-card__icon--secondary',
  },
  {
    name: 'San Bug Ban Dem',
    description: 'Doc log loi va sua doan code dang gay sai ket qua.',
    difficulty: 'hard' as const,
    reward: 50,
    icon: 'bug_report',
    iconClass: 'practice-challenge-card__icon--error',
  },
];

const storeItems = [
  { name: 'Theme Ocean', price: 120, image: 'OCEAN', featured: true },
  { name: 'Avatar Ninja', price: 180, image: 'NINJA' },
  { name: 'XP Boost 2x', price: 90, image: 'BOOST' },
];

export function PracticePage({ user }: PracticePageProps) {
  return (
    <main className="practice-main">
      <div className="practice-content">
        <div className="practice-center">
          <StreakCalendar userId={user.id} />

          <section className="practice-challenges">
            <h2 className="practice-challenges__title">Thu thach hom nay</h2>
            {challenges.map((challenge) => (
              <article key={challenge.name} className="practice-challenge-card">
                <div className="practice-challenge-card__content">
                  <div className={`practice-challenge-card__icon ${challenge.iconClass}`}>
                    <span className="material-symbols-outlined">{challenge.icon}</span>
                  </div>

                  <div className="practice-challenge-card__info">
                    <h3 className="practice-challenge-card__name">{challenge.name}</h3>
                    <p className="practice-challenge-card__desc">{challenge.description}</p>
                    <div className="practice-challenge-card__meta">
                      <span className={`practice-challenge-card__difficulty practice-challenge-card__difficulty--${challenge.difficulty}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="practice-challenge-card__reward">
                        <span className="material-symbols-outlined">monetization_on</span>
                        {challenge.reward}
                      </span>
                    </div>
                  </div>
                </div>

                <button type="button" className="practice-challenge-card__btn pressable">
                  Bat dau
                </button>
              </article>
            ))}
          </section>

          <section className="practice-store">
            <div className="practice-store__header">
              <h2 className="practice-store__title">Doi qua bang coins</h2>
              <button type="button" className="practice-store__view-all">
                Xem tat ca
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
          </section>
        </div>

        <aside className="practice-sidebar">
          <Leaderboard />

          <section className="practice-tip">
            <div className="practice-tip__icon">
              <span className="material-symbols-outlined">lightbulb</span>
            </div>
            <h2 className="practice-tip__title">Meo luyen tap</h2>
            <p className="practice-tip__content">
              Neu bi mac o bai kho, hay tach bai toan thanh cac ham nho va kiem tra tung phan
              bang output don gian truoc khi toi uu.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
