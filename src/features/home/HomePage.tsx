import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { MobileNavigation, SideNavigation, TopNavigation } from './HomeNavigation';
import { useLessons, type Lesson } from './useLessons';
import { useLessonProgress } from './useLessonProgress';
import { usePyodideRunner } from './usePyodideRunner';

type OutputTone = 'idle' | 'success' | 'error';

const STORAGE_KEY = 'python-adventure.home-editor-code';
const DEFAULT_CODE = `# Hãy viết mã của bạn bên dưới
print("Chào Py-Bot!")`;

function getInitialCode() {
  if (typeof window === 'undefined') {
    return DEFAULT_CODE;
  }

  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_CODE;
}

export function HomePage() {
  const { lessons, loading: lessonsLoading, error: lessonsError } = useLessons();
  const { completedLessonIds, loading: progressLoading, markLessonCompleted } = useLessonProgress();
  const { runCode, startupMessage, status } = usePyodideRunner();
  const [code, setCode] = useState(getInitialCode);
  const [outputTone, setOutputTone] = useState<OutputTone>('idle');
  const [output, setOutput] = useState('Đang khởi tạo Python runtime...');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('Cơ bản lớp 6');
  const [isHintLoading, setIsHintLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading' || status === 'error') {
      setOutput(startupMessage);
      setOutputTone(status === 'error' ? 'error' : 'idle');
      return;
    }

    setOutput((currentOutput) => {
      if (currentOutput === 'Đang khởi tạo Python runtime...') {
        return startupMessage;
      }

      return currentOutput;
    });
  }, [startupMessage, status]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const tracks = useMemo(() => {
    const uniqueTracks = Array.from(new Set(lessons.map((lesson) => lesson.track)));
    return uniqueTracks.length > 0 ? uniqueTracks : ['Cơ bản lớp 6'];
  }, [lessons]);

  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => lesson.track === selectedTrack),
    [lessons, selectedTrack],
  );

  useEffect(() => {
    if (!tracks.includes(selectedTrack) && tracks.length > 0) {
      setSelectedTrack(tracks[0]);
    }
  }, [selectedTrack, tracks]);

  useEffect(() => {
    if (filteredLessons.length === 0) {
      setSelectedLessonId(null);
      return;
    }

    const hasSelectedLesson = filteredLessons.some((lesson) => lesson.id === selectedLessonId);
    if (!hasSelectedLesson) {
      setSelectedLessonId(filteredLessons[0].id);
    }
  }, [filteredLessons, selectedLessonId]);

  const selectedLesson = filteredLessons.find((lesson) => lesson.id === selectedLessonId) || null;
  const lineNumbers = code.split('\n');
  const completedLessons = completedLessonIds.length;
  const totalLessons = lessons.length;
  const progressPercent =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const currentLessonCompleted = selectedLesson ? completedLessonIds.includes(selectedLesson.id) : false;

  function doesLessonPassCompletionCheck(lesson: Lesson, currentCode: string, currentOutput: string) {
    if (lesson.completionCheckType === 'code_contains') {
      return currentCode.includes(lesson.completionCheckValue);
    }

    return currentOutput.includes(lesson.completionCheckValue);
  }

  async function handleRunCode() {
    setOutputTone('idle');
    setOutput('Đang chạy mã Python...');

    const result = await runCode(code);
    setOutputTone(result.kind);
    setOutput(result.output);

    if (
      result.kind === 'success' &&
      selectedLesson &&
      !completedLessonIds.includes(selectedLesson.id) &&
      doesLessonPassCompletionCheck(selectedLesson, code, result.output)
    ) {
      await markLessonCompleted(selectedLesson.id);
      setOutput(`${result.output}\n\nHoàn thành bài học: ${selectedLesson.title}`);
    }
  }

  function resetCode() {
    setCode(selectedLesson?.starterCode || DEFAULT_CODE);
    setOutputTone('idle');
    setOutput('Editor đã được đặt lại theo bài học hiện tại.');
  }

  async function showHint() {
    if (!selectedLesson) {
      setOutputTone('error');
      setOutput('Hãy chọn một bài học trước khi xin gợi ý AI.');
      return;
    }

    setIsHintLoading(true);
    setOutputTone('idle');
    setOutput('Đang xin gợi ý từ Groq AI...');

    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonTitle: selectedLesson.title,
          objective: selectedLesson.objective,
          starterCode: selectedLesson.starterCode,
          code,
        }),
      });

      const payload = (await response.json()) as { hint?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.message || 'Không lấy được gợi ý từ Groq.');
      }

      setOutputTone('success');
      setOutput(`Gợi ý AI:\n${payload.hint || 'Chưa có gợi ý.'}`);
    } catch (error) {
      setOutputTone('error');
      setOutput(error instanceof Error ? error.message : 'Không lấy được gợi ý từ Groq.');
    } finally {
      setIsHintLoading(false);
    }
  }

  function handleLessonSelect(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setCode(lesson.starterCode);
    setOutputTone('idle');
    setOutput(`Đã mở bài học "${lesson.title}".`);
  }

  function handleTrackSelect(track: string) {
    setSelectedTrack(track);
    setOutputTone('idle');
    setOutput(`Đã chuyển sang lộ trình "${track}".`);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.currentTarget;
      const nextValue = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;
      setCode(nextValue);

      requestAnimationFrame(() => {
        event.currentTarget.selectionStart = selectionStart + 4;
        event.currentTarget.selectionEnd = selectionStart + 4;
      });
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleRunCode();
    }
  }

  return (
    <div className="quest-page">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__title">PythonQuest</span>
        </div>

        <TopNavigation />

        <div className="topbar__profile">
          <span aria-hidden="true" className="material-symbols-outlined topbar__star">
            star
          </span>
          <div className="topbar__avatar">
            <img
              alt="Junior Coder Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgNKNaVqWu7orFFAIrGfAV1JelJ5ydOTJh-a_CLY_Ww3ICx4EixAV4wmC6kZzUbUCVT5Aq8T2byBaHQokPgO-84ihTNK0z0BE-rSnlPo4tngru4pBNgLBUQPHWNq1g6CfN1ziiZ9X0Za8eeoDlKF9PdiEmS3aR5-AJSc2mX6SxpYHdVxGleH4gk6Eky81qYE8xTcg-Wga4U8aZoGDVXlxtTasNy5fYhcwYyRbB6xh5chhTBGbAfoumChi4mzMmQFP5gO87Sd6huTtZ"
            />
          </div>
        </div>
      </header>

      <main className="quest-layout">
        <aside className="sidenav">
          <div className="profile-card">
            <div className="profile-card__icon">
              <span aria-hidden="true" className="material-symbols-outlined">
                military_tech
              </span>
            </div>
            <div>
              <p className="profile-card__title">Level 5</p>
              <p className="profile-card__subtitle">Code Explorer</p>
            </div>
          </div>

          <SideNavigation />

          <div className="upgrade-card">
            <p className="upgrade-card__title">Học không giới hạn!</p>
            <button className="pressable upgrade-card__button" type="button">
              Upgrade to Pro
            </button>
          </div>
        </aside>

        <section className="lesson-layout">
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
                {tracks.map((track) => (
                  <button
                    key={track}
                    className={`pressable track-tab${track === selectedTrack ? ' is-active' : ''}`}
                    role="tab"
                    type="button"
                    onClick={() => handleTrackSelect(track)}
                  >
                    {track}
                  </button>
                ))}
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
                    onClick={() => handleLessonSelect(lesson)}
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

          <div className="workspace-panel">
            <section className="editor-shell" aria-label="Python editor">
              <div className="editor-shell__header">
                <div className="editor-shell__meta">
                  <div className="window-dots" aria-hidden="true">
                    <span className="window-dots__dot is-red" />
                    <span className="window-dots__dot is-yellow" />
                    <span className="window-dots__dot is-green" />
                  </div>
                  <span className="editor-shell__filename">
                    {selectedLesson ? `${selectedLesson.slug}.py` : 'main.py'}
                  </span>
                </div>
                <span aria-hidden="true" className="material-symbols-outlined editor-shell__terminal">
                  terminal
                </span>
              </div>

              <div className="editor-shell__body">
                <div className="editor-surface">
                  <div aria-hidden="true" className="editor-surface__gutter">
                    {lineNumbers.map((_, index) => (
                      <span key={`line-${index + 1}`} className="editor-surface__line-number">
                        {index + 1}
                      </span>
                    ))}
                  </div>

                  <textarea
                    aria-label="Python code editor"
                    className="editor-surface__input"
                    spellCheck={false}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    onKeyDown={handleEditorKeyDown}
                  />
                </div>
              </div>

              <div className="editor-shell__actions">
                <div className="editor-shell__buttons">
                  <button
                    className="pressable editor-button editor-button--secondary"
                    disabled={isHintLoading || !selectedLesson}
                    type="button"
                    onClick={() => void showHint()}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      lightbulb
                    </span>
                    {isHintLoading ? 'Đang hỏi AI' : 'Gợi ý AI'}
                  </button>
                  <button
                    className="pressable editor-button editor-button--secondary"
                    type="button"
                    onClick={resetCode}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      refresh
                    </span>
                    Đặt lại
                  </button>
                </div>
                <button
                  className="pressable editor-button editor-button--primary"
                  disabled={status === 'loading' || status === 'running'}
                  type="button"
                  onClick={() => void handleRunCode()}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    play_arrow
                  </span>
                  {status === 'loading'
                    ? 'Đang tải Python'
                    : status === 'running'
                      ? 'Đang chạy'
                      : 'Chạy mã'}
                </button>
              </div>
            </section>

            <section className="output-shell" aria-label="Playground output">
              <div className="output-shell__header">
                <span aria-hidden="true" className="material-symbols-outlined">
                  wysiwyg
                </span>
                <span>Kết quả màn hình</span>
              </div>
              <div className={`output-shell__body output-shell__body--${outputTone}`}>
                <div className="output-shell__robot">
                  <span aria-hidden="true" className="material-symbols-outlined">
                    {outputTone === 'error' ? 'error' : 'smart_toy'}
                  </span>
                </div>
                <pre className="output-shell__text">{output}</pre>
              </div>
            </section>
          </div>
        </section>
      </main>

      <MobileNavigation />
    </div>
  );
}
