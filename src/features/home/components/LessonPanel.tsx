import { VI_MESSAGES } from '../../../content/messages';
import type { Lesson } from '../useLessons';
import { PetStatusCard, type UserPet, type PetAccessory } from '../../pet';

type LessonPanelProps = {
  lessons: Lesson[];
  completedLessonIds: number[];
  lessonsLoading: boolean;
  lessonsError: string | null;
  progressLoading: boolean;
  selectedLessonId: number | null;
  selectedTrack: string;
  tracks: string[];
  isProUser: boolean;
  onLessonSelect: (lesson: Lesson) => void;
  onTrackSelect: (track: string) => void;
  activePet: UserPet | null;
  activeAccessories?: PetAccessory[];
  isStreakExcited: boolean;
  onFeedPet: () => Promise<void> | void;
  onOpenShop?: () => void;
};

const PRO_TRACKS = [VI_MESSAGES.tracks.advancedGrade6] as const;

export function LessonPanel({
  lessons,
  completedLessonIds,
  lessonsLoading,
  lessonsError,
  progressLoading,
  selectedLessonId,
  selectedTrack,
  tracks,
  isProUser,
  onLessonSelect,
  onTrackSelect,
  activePet,
  activeAccessories = [],
  isStreakExcited,
  onFeedPet,
  onOpenShop,
}: LessonPanelProps) {
  const filteredLessons = lessons.filter((lesson) => lesson.track === selectedTrack);
  const completedLessons = completedLessonIds.length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const selectedLesson = filteredLessons.find((lesson) => lesson.id === selectedLessonId) || null;
  // const currentLessonCompleted = selectedLesson ? completedLessonIds.includes(selectedLesson.id) : false;

  return (
    <div className="lesson-panel">
      <div>
        <h1 className="lesson-panel__title">
          {selectedLesson
            ? `${selectedLesson.chapter}: ${selectedLesson.title}`
            : 'Danh sách bài học'}
        </h1>
        <div className="lesson-panel__divider" />
      </div>

      {activePet && (
        <div style={{ marginBottom: '16px', marginTop: '8px' }}>
          <PetStatusCard
            pet={activePet}
            isStreakExcited={isStreakExcited}
            onFeed={onFeedPet}
            activeAccessories={activeAccessories}
            onOpenShop={onOpenShop}
          />
        </div>
      )}
      <section className="lessons-card" aria-labelledby="lessons-heading">
        <div className="lessons-card__header">
          <h2 id="lessons-heading">Danh sách bài học</h2>
          <span>
            {completedLessons}/{lessons.length || 0} hoàn thành
          </span>
        </div>

        <div className="track-tabs" role="tablist" aria-label="Lộ trình học">
          {tracks.map((track) => {
            const isLockedTrack = PRO_TRACKS.includes(track as (typeof PRO_TRACKS)[number]);
            const isDisabled = isLockedTrack && !isProUser;

            return (
              <button
                key={track}
                className={`pressable track-tab${track === selectedTrack ? ' is-active' : ''}${isDisabled ? ' is-disabled' : ''}`}
                disabled={isDisabled}
                role="tab"
                title={isDisabled ? 'Chỉ dành cho tài khoản Pro' : undefined}
                type="button"
                onClick={() => onTrackSelect(track)}
              >
                <span>{track}</span>
                {isDisabled ? (
                  <span aria-hidden="true" className="material-symbols-outlined track-tab__icon">
                    lock
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {lessonsLoading ? <p className="lessons-card__status">Đang tải bài học từ Neon DB...</p> : null}
        {lessonsError ? <p className="lessons-card__status is-error">{lessonsError}</p> : null}
        {progressLoading ? <p className="lessons-card__status">Đang tải tiến trình học tập...</p> : null}

        <div className="lessons-list">
          {filteredLessons.map((lesson) => (
            <button
              key={lesson.id}
              className={`pressable lesson-item${lesson.id === selectedLessonId ? ' is-active' : ''}`}
              type="button"
              onClick={() => onLessonSelect(lesson)}
            >
              <span className="lesson-item__order">{String(lesson.lessonOrder).padStart(2, '0')}</span>
              <div className="lesson-item__content">
                <strong>{lesson.title}</strong>
                <span>{lesson.description}</span>
              </div>
              <span className="lesson-item__state">
                {completedLessonIds.includes(lesson.id) ? 'Đã xong' : 'Đang học'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="progress-block">
        <div className="progress-block__meta">
          <span>Tiến trình</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="progress-block__track" aria-hidden="true">
          <div className="progress-block__value" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}