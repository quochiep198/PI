import { VI_MESSAGES } from '../../../content/messages';
import type { Lesson } from '../useLessons';

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
}: LessonPanelProps) {
  const filteredLessons = lessons.filter((lesson) => lesson.track === selectedTrack);
  const completedLessons = completedLessonIds.length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const selectedLesson = filteredLessons.find((lesson) => lesson.id === selectedLessonId) || null;
  const currentLessonCompleted = selectedLesson ? completedLessonIds.includes(selectedLesson.id) : false;

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

      <article className="story-card">
        <div className="story-card__avatar">
          <img
            alt="Py-Bot"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKwBXvyV97-lLR8lVF7nzy5WHe3jt-eC5ad1WZ8IxImidpU-qnVuGGFaFyDVmygzdwSZq_JQz5bhngeyhh95G1W1idsmiwbf4ixlZQrBG_pYByPanjgfjXpI37jlQiy9KqYtOgtcwRbNURrIsS-ih82c_eTTX5qK-FlXB4ad2xhyq_tIw4GDJD14qPvL0cRZADu2b7-ekbVl_r7tH46P6tPYLkCTaZkAvmeIBEhdQD4BQ86ancZSfDqlYrX5rgwhecWorN9oxxNvNw"
          />
        </div>
        <div className="story-card__content">
          <p className="story-card__name">Py-Bot</p>
          <p className="story-card__quote">
            {selectedLesson
              ? `"${selectedLesson.description}"`
              : '"Chọn một bài học từ danh sách để bắt đầu."'}
          </p>
        </div>
      </article>

      <article className="task-card">
        <div className="task-card__hint-icon">
          <span aria-hidden="true" className="material-symbols-outlined">
            lightbulb
          </span>
        </div>
        <h2 className="task-card__title">
          <span aria-hidden="true" className="material-symbols-outlined">
            assignment
          </span>
          Nhiệm vụ của bạn
        </h2>
        <p className="task-card__description">
          {selectedLesson?.objective ||
            'Chọn một bài học để xem mục tiêu và mã khởi đầu từ Neon DB.'}
        </p>
        <div className="task-card__instruction">
          <p>
            {selectedLesson
              ? `Starter code sẽ được nạp vào editor khi bạn chọn "${selectedLesson.title}".`
              : 'Danh sách bài học đang được tải từ cơ sở dữ liệu Neon DB.'}
          </p>
        </div>
        <div className="task-card__status">
          {selectedLesson
            ? currentLessonCompleted
              ? 'Trạng thái: Đã hoàn thành'
              : 'Trạng thái: Chưa hoàn thành'
            : 'Trạng thái: Chưa chọn bài học'}
        </div>
      </article>


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