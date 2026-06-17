import { type KeyboardEvent, type ChangeEvent, useMemo } from 'react';
import type { Lesson } from '../useLessons';
import type { RuntimeStatus } from '../usePyodideRunner';
import { VI_MESSAGES } from '../../../content/messages';

type OutputTone = 'idle' | 'success' | 'error';

type WorkspacePanelProps = {
  code: string;
  output: string;
  outputTone: OutputTone;
  status: RuntimeStatus;
  selectedLesson: Lesson | null;
  isHintLoading: boolean;
  isErrorFeedbackLoading: boolean;
  isReviewLoading: boolean;
  onCodeChange: (code: string) => void;
  onEditorKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onRunCode: () => void;
  onResetCode: () => void;
  onShowHint: () => void;
  onShowCodeReview: () => void;
};

export function WorkspacePanel({
  code,
  output,
  outputTone,
  status,
  selectedLesson,
  isHintLoading,
  isErrorFeedbackLoading,
  isReviewLoading,
  onCodeChange,
  onEditorKeyDown,
  onRunCode,
  onResetCode,
  onShowHint,
  onShowCodeReview,
}: WorkspacePanelProps) {
  const lineNumbers = useMemo(() => code.split('\n'), [code]);
  const isRunning = status === 'loading' || status === 'running';

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onCodeChange(event.target.value);
  }

  return (
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
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              data-gramm="false"
              value={code}
              onChange={handleChange}
              onKeyDown={onEditorKeyDown}
            />
          </div>
        </div>

        <div className="editor-shell__actions">
          <div className="editor-shell__buttons">
            <button
              className="pressable editor-button editor-button--secondary"
              disabled={isHintLoading || isReviewLoading || !selectedLesson || isRunning}
              type="button"
              onClick={() => void onShowHint()}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                lightbulb
              </span>
              {isHintLoading ? VI_MESSAGES.home.labels.askingAi : VI_MESSAGES.home.labels.askAi}
            </button>
            <button
              className="pressable editor-button editor-button--secondary"
              disabled={isHintLoading || isReviewLoading || !selectedLesson || isRunning}
              type="button"
              onClick={() => void onShowCodeReview()}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                rate_review
              </span>
              {isReviewLoading ? VI_MESSAGES.home.labels.askingReview : VI_MESSAGES.home.labels.askReview}
            </button>
            <button
              className="pressable editor-button editor-button--secondary"
              disabled={isHintLoading || isReviewLoading || isRunning}
              type="button"
              onClick={onResetCode}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                refresh
              </span>
              {VI_MESSAGES.home.labels.reset}
            </button>
          </div>
          <button
            className="pressable editor-button editor-button--primary"
            disabled={isRunning || isErrorFeedbackLoading || isReviewLoading}
            type="button"
            onClick={() => void onRunCode()}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              play_arrow
            </span>
            {status === 'loading'
              ? VI_MESSAGES.home.labels.loadingPython
              : status === 'running'
                ? VI_MESSAGES.home.labels.running
                : isErrorFeedbackLoading
                  ? VI_MESSAGES.home.labels.explainingError
                  : VI_MESSAGES.home.labels.runCode}
          </button>
        </div>
      </section>

      <section className="output-shell" aria-label="Playground output">
        <div className="output-shell__header">
          <span aria-hidden="true" className="material-symbols-outlined">
            wysiwyg
          </span>
          <span>{VI_MESSAGES.home.labels.outputTitle}</span>
        </div>
        <div className={`output-shell__body output-shell__body--${outputTone}`}>
          <pre className="output-shell__text">{output}</pre>
        </div>
      </section>
    </div>
  );
}
