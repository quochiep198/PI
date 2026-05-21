import { useLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardEntry } from '../types/leaderboard';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgNKNaVqWu7orFFAIrGfAV1JelJ5ydOTJh-a_CLY_Ww3ICx4EixAV4wmC6kZzUbUCVT5Aq8T2byBaHQokPgO-84ihTNK0z0BE-rSnlPo4tngru4pBNgLBUQPHWNq1g6CfN1ziiZ9X0Za8eeoDlKF9PdiEmS3aR5-AJSc2mX6SxpYHdVxGleH4gk6Eky81qYE8xTcg-Wga4U8aZoGDVXlxtTasNy5fYhcwYyRbB6xh5chhTBGbAfoumChi4mzMmQFP5gO87Sd6huTtZ';

function getRankClass(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) return 'practice-leaderboard__item-rank-num--user';
  if (rank === 1) return 'practice-leaderboard__item-rank-num--gold';
  if (rank === 2) return 'practice-leaderboard__item-rank-num--silver';
  if (rank === 3) return 'practice-leaderboard__item-rank-num--bronze';
  return '';
}

function LeaderboardRow(entry: LeaderboardEntry) {
  return (
    <article
      key={entry.isCurrentUser ? `current-${entry.id}` : entry.id}
      className={`practice-leaderboard__item ${entry.rank <= 3 ? 'practice-leaderboard__item--top' : ''} ${entry.isCurrentUser ? 'practice-leaderboard__user' : ''}`}
    >
      <div className="practice-leaderboard__item-rank">
        <span className={`practice-leaderboard__item-rank-num ${getRankClass(entry.rank, entry.isCurrentUser)}`}>
          #{entry.rank}
        </span>
      </div>
      <div className={`practice-leaderboard__item-avatar ${entry.isCurrentUser ? 'practice-leaderboard__item-avatar--user' : ''}`}>
        <img alt={entry.username} src={entry.avatarUrl ?? DEFAULT_AVATAR} />
      </div>
      <div className="practice-leaderboard__item-info">
        <p className="practice-leaderboard__item-name">{entry.username}</p>
        <p className="practice-leaderboard__item-zone">
          {entry.title} • {entry.coins.toLocaleString()} coins
        </p>
      </div>
      <span className="practice-leaderboard__item-xp">{entry.xp.toLocaleString()} XP</span>
    </article>
  );
}

export function Leaderboard() {
  const { topEntries, currentUserEntry, state, error, refetch } = useLeaderboard();

  return (
    <section className="practice-leaderboard">
      <div className="practice-leaderboard__header">
        <h2 className="practice-leaderboard__title">Bang xep hang</h2>
        <span className="material-symbols-outlined practice-leaderboard__icon">
          social_leaderboard
        </span>
      </div>

      {state === 'loading' && topEntries.length === 0 ? (
        <div className="practice-leaderboard__list">
          <article className="practice-leaderboard__item">
            <div className="practice-leaderboard__item-info">
              <p className="practice-leaderboard__item-name">Dang tai bang xep hang...</p>
              <p className="practice-leaderboard__item-zone">Dang dong bo XP va coins</p>
            </div>
          </article>
        </div>
      ) : null}

      {state === 'error' ? (
        <div className="practice-leaderboard__list">
          <article className="practice-leaderboard__item">
            <div className="practice-leaderboard__item-info">
              <p className="practice-leaderboard__item-name">Khong tai duoc bang xep hang</p>
              <p className="practice-leaderboard__item-zone">{error}</p>
            </div>
            <button
              type="button"
              className="practice-leaderboard__view-all"
              onClick={() => void refetch()}
            >
              Thu lai
            </button>
          </article>
        </div>
      ) : null}

      {state !== 'error' && topEntries.length > 0 ? (
        <>
          <div className="practice-leaderboard__list">
            {topEntries.map((entry) => LeaderboardRow(entry))}
            {currentUserEntry ? LeaderboardRow(currentUserEntry) : null}
          </div>

          <button
            type="button"
            className="practice-leaderboard__view-all"
            onClick={() => void refetch()}
          >
            Lam moi
          </button>
        </>
      ) : null}
    </section>
  );
}
