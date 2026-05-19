import { useEffect, useState, type FC } from 'react';
import type { CelebrationModalProps } from '../types/streak';

const CONFETTI_COLORS = [
  '#ffde59',
  '#3045e3',
  '#286553',
  '#ba1a1a',
  '#705d00',
  '#4d61fc',
];

function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: `${8 + Math.random() * 8}px`,
    rotation: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="celebration-confetti" aria-hidden="true">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="celebration-confetti__piece"
          style={{
            left: particle.left,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            transform: `rotate(${particle.rotation})`,
          }}
        />
      ))}
    </div>
  );
}

export const CelebrationModal: FC<CelebrationModalProps> = ({
  isOpen,
  streak,
  reward,
  achievement,
  onClose,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setShow(true);
      });
    } else {
      setShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`celebration-modal ${show ? 'is-visible' : ''}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      {show && <Confetti />}

      <div className="celebration-modal__card">
        <div className="celebration-modal__icon">
          <span className="material-symbols-outlined celebration-modal__icon-inner">
            celebration
          </span>
        </div>

        <h2 id="celebration-title" className="celebration-modal__title">
          {achievement || 'Check-in thành công!'}
        </h2>

        {achievement ? (
          <p className="celebration-modal__achievement">{achievement}</p>
        ) : null}

        <div className="celebration-modal__stats">
          <div className="celebration-modal__stat">
            <span className="celebration-modal__stat-value">
              <span className="material-symbols-outlined celebration-modal__stat-icon">
                local_fire_department
              </span>
              {streak}
            </span>
            <span className="celebration-modal__stat-label">Ngày streak</span>
          </div>

          <div className="celebration-modal__stat celebration-modal__stat--reward">
            <span className="celebration-modal__stat-value">
              <span className="material-symbols-outlined celebration-modal__stat-icon celebration-modal__stat-icon--coin">
                monetization_on
              </span>
              +{reward}
            </span>
            <span className="celebration-modal__stat-label">Coins nhận được</span>
          </div>
        </div>

        <button
          type="button"
          className="celebration-modal__close"
          onClick={onClose}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};