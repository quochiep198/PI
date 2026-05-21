import type { Challenge } from '../types/challenge';

type ChallengeCardProps = {
  challenge: Challenge;
  onStart: (challenge: Challenge) => void;
};

const iconMap = {
  primary: { icon: 'smart_toy', className: 'practice-challenge-card__icon--primary' },
  secondary: { icon: 'diamond', className: 'practice-challenge-card__icon--secondary' },
  error: { icon: 'bug_report', className: 'practice-challenge-card__icon--error' },
};

const difficultyIcons: Record<Challenge['difficulty'], string> = {
  easy: 'signal_cellular_alt_1_bar',
  medium: 'signal_cellular_alt_2_bar',
  hard: 'signal_cellular_alt',
};

export function ChallengeCard({ challenge, onStart }: ChallengeCardProps) {
  const iconConfig = iconMap[challenge.difficulty === 'hard' ? 'error' : challenge.difficulty === 'medium' ? 'secondary' : 'primary'];

  return (
    <article className={`practice-challenge-card ${challenge.completed ? 'practice-challenge-card--completed' : ''}`}>
      <div className="practice-challenge-card__content">
        <div className={`practice-challenge-card__icon ${iconConfig.className}`}>
          <span className="material-symbols-outlined">{iconConfig.icon}</span>
        </div>

        <div className="practice-challenge-card__info">
          <h3 className="practice-challenge-card__name">
            {challenge.title}
            {challenge.completed && (
              <span className="practice-challenge-card__completed-badge">
                <span className="material-symbols-outlined">check_circle</span>
              </span>
            )}
          </h3>
          <p className="practice-challenge-card__desc" dangerouslySetInnerHTML={{ __html: challenge.description }} />
          <div className="practice-challenge-card__meta">
            <span className={`practice-challenge-card__difficulty practice-challenge-card__difficulty--${challenge.difficulty}`}>
              <span className="material-symbols-outlined">{difficultyIcons[challenge.difficulty]}</span>
              {challenge.difficulty === 'easy' ? 'Dễ' : challenge.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
            </span>
            <span className="practice-challenge-card__reward">
              <span className="material-symbols-outlined">monetization_on</span>
              +{challenge.coinsReward}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="practice-challenge-card__btn pressable"
        onClick={() => onStart(challenge)}
        disabled={challenge.completed}
      >
        {challenge.completed ? 'Đã hoàn thành' : 'Bắt đầu'}
      </button>
    </article>
  );
}