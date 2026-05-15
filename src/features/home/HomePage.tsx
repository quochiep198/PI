import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { VI_MESSAGES } from '../../content/messages';
import type { AuthUser } from '../auth/types';
import { LessonPanel } from './components/LessonPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { HomeHeader } from './components/HomeHeader';
import { HomeSideNav } from './components/HomeSideNav';
import { LevelUpModal } from './components/LevelUpModal';
import { useLessons, type Lesson } from './useLessons';
import { useLessonProgress } from './useLessonProgress';
import { useOnlineLearners } from './useOnlineLearners';
import { usePyodideRunner } from './usePyodideRunner';
import { useXP } from './useXP';
import { MobileNavigation } from '../navigate/NavigateNavigation';

type OutputTone = 'idle' | 'success' | 'error';
type RuntimeFeedback = {
  kind: OutputTone;
  output: string;
} | null;

const STORAGE_KEY = 'python-adventure.home-editor-code';
const PRO_TRACKS = [VI_MESSAGES.tracks.advancedGrade6] as const;
const DEFAULT_CODE = VI_MESSAGES.home.defaultCode;

function normalizeEditorCode(value: string | null | undefined, fallback = DEFAULT_CODE) {
  if (!value) {
    return fallback;
  }
  return value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function getInitialCode() {
  if (typeof window === 'undefined') {
    return DEFAULT_CODE;
  }
  return normalizeEditorCode(window.localStorage.getItem(STORAGE_KEY));
}

type HomePageProps = {
  user: AuthUser;
  onLogout: () => Promise<void> | void;
};

export function HomePage({ user, onLogout }: HomePageProps) {
  const { lessons, loading: lessonsLoading, error: lessonsError } = useLessons();
  const { completedLessonIds, loading: progressLoading, markLessonCompleted } = useLessonProgress();
  const {
    onlineLearners,
    connected: onlinePresenceConnected,
    failed: onlinePresenceFailed,
  } = useOnlineLearners();
  const { runCode, startupMessage, status } = usePyodideRunner();
  const {
    xpData,
    loading: xpLoading,
    showLevelUpModal,
    pendingXpAnimation,
    recordFirstSuccess,
    dismissLevelUpModal,
  } = useXP();
  const isProUser = Boolean(user.isPro);

  const [code, setCode] = useState(getInitialCode);
  const [outputTone, setOutputTone] = useState<OutputTone>('idle');
  const [output, setOutput] = useState<string>(VI_MESSAGES.home.output.initializingRuntime);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>(VI_MESSAGES.tracks.basicGrade6);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isErrorFeedbackLoading, setIsErrorFeedbackLoading] = useState(false);
  const [lastRuntimeFeedback, setLastRuntimeFeedback] = useState<RuntimeFeedback>(null);

  useEffect(() => {
    if (status === 'loading' || status === 'error') {
      setOutput(startupMessage);
      setOutputTone(status === 'error' ? 'error' : 'idle');
      return;
    }

    setOutput((currentOutput) => {
      if (currentOutput === VI_MESSAGES.home.output.initializingRuntime) {
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
    const visibleTracks = isProUser
      ? uniqueTracks
      : [...uniqueTracks, ...PRO_TRACKS.filter((track) => !uniqueTracks.includes(track))];
    return visibleTracks.length > 0 ? visibleTracks : [VI_MESSAGES.tracks.basicGrade6];
  }, [isProUser, lessons]);

  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => lesson.track === selectedTrack),
    [lessons, selectedTrack],
  );

  useEffect(() => {
    if (!tracks.includes(selectedTrack) && tracks.length > 0) {
      setSelectedTrack(tracks[0]);
      return;
    }

    if (!isProUser && PRO_TRACKS.includes(selectedTrack as (typeof PRO_TRACKS)[number])) {
      const fallbackTrack = tracks.find((track) => !PRO_TRACKS.includes(track as (typeof PRO_TRACKS)[number]));
      if (fallbackTrack) {
        setSelectedTrack(fallbackTrack);
      }
    }
  }, [isProUser, selectedTrack, tracks]);

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

  function doesLessonPassCompletionCheck(lesson: Lesson, currentCode: string, currentOutput: string) {
    if (lesson.completionCheckType === 'code_contains') {
      return currentCode.includes(lesson.completionCheckValue);
    }
    return currentOutput.includes(lesson.completionCheckValue);
  }

  async function fetchErrorFeedback(errorOutput: string) {
    if (!selectedLesson) {
      return;
    }

    setIsErrorFeedbackLoading(true);

    try {
      const response = await fetch('/api/error-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          code,
          errorOutput,
        }),
      });

      const payload = (await response.json()) as {
        explanation?: string;
        fixFocus?: string;
        preventionTip?: string;
        guidance?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || VI_MESSAGES.home.output.aiErrorFailed);
      }

      const explanationBlock = [
        VI_MESSAGES.home.output.aiErrorAnalysisTitle,
        payload.explanation || VI_MESSAGES.home.output.aiErrorFallback,
        '',
        VI_MESSAGES.home.output.aiFixFocusTitle,
        payload.fixFocus || payload.guidance || VI_MESSAGES.home.output.aiFixFocusFallback,
        '',
        VI_MESSAGES.home.output.aiPreventionTitle,
        payload.preventionTip || payload.guidance || VI_MESSAGES.home.output.aiPreventionFallback,
      ].join('\n');

      setOutput(explanationBlock);
    } catch (error) {
      setOutput(
        `${VI_MESSAGES.home.output.aiErrorFailed}\n${
          error instanceof Error ? error.message : VI_MESSAGES.home.output.unknownError
        }`,
      );
    } finally {
      setIsErrorFeedbackLoading(false);
    }
  }

  async function handleRunCode() {
    setOutputTone('idle');
    setOutput(VI_MESSAGES.home.output.runningCode);

    const result = await runCode(code);
    setOutputTone(result.kind);
    setLastRuntimeFeedback({
      kind: result.kind,
      output: result.output,
    });

    if (result.kind === 'error') {
      setOutput(VI_MESSAGES.home.output.fetchingErrorFeedback);
      await fetchErrorFeedback(result.output);
      return;
    }

    setOutput(result.output);

    if (selectedLesson && result.kind === 'success') {
      void recordFirstSuccess(selectedLesson.id);
    }

    if (
      result.kind === 'success' &&
      selectedLesson &&
      !completedLessonIds.includes(selectedLesson.id) &&
      doesLessonPassCompletionCheck(selectedLesson, code, result.output)
    ) {
      await markLessonCompleted(selectedLesson.id);
      setOutput(VI_MESSAGES.home.output.completedLesson(selectedLesson.title, result.output));
    }
  }

  function handleResetCode() {
    setCode(normalizeEditorCode(selectedLesson?.starterCode));
    setLastRuntimeFeedback(null);
    setOutputTone('idle');
    setOutput(VI_MESSAGES.home.output.resetEditor);
  }

  async function handleShowHint() {
    if (!selectedLesson) {
      setOutputTone('error');
      setOutput(VI_MESSAGES.home.output.selectLessonForHint);
      return;
    }

    setIsHintLoading(true);
    setOutputTone('idle');
    setOutput(VI_MESSAGES.home.output.askingHint);

    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          lessonTitle: selectedLesson.title,
          objective: selectedLesson.objective,
          starterCode: selectedLesson.starterCode,
          code,
          output: lastRuntimeFeedback?.kind === 'success' ? lastRuntimeFeedback.output : undefined,
          errorOutput: lastRuntimeFeedback?.kind === 'error' ? lastRuntimeFeedback.output : undefined,
        }),
      });

      const payload = (await response.json()) as { hint?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.message || VI_MESSAGES.home.output.hintFetchFailed);
      }

      setOutputTone('success');
      setOutput(`${VI_MESSAGES.home.output.hintTitle}\n${payload.hint || VI_MESSAGES.home.output.noHintYet}`);
    } catch (error) {
      setOutputTone('error');
      setOutput(error instanceof Error ? error.message : VI_MESSAGES.home.output.hintFetchFailed);
    } finally {
      setIsHintLoading(false);
    }
  }

  function handleLessonSelect(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setCode(normalizeEditorCode(lesson.starterCode));
    setLastRuntimeFeedback(null);
    setOutputTone('idle');
    setOutput(VI_MESSAGES.home.output.openLesson(lesson.title));
  }

  function handleTrackSelect(track: string) {
    if (PRO_TRACKS.includes(track as (typeof PRO_TRACKS)[number]) && !isProUser) {
      setOutputTone('idle');
      setOutput(VI_MESSAGES.home.output.proTrackOnly);
      return;
    }

    setSelectedTrack(track);
    setOutputTone('idle');
    setOutput(VI_MESSAGES.home.output.switchedTrack(track));
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
      <HomeHeader user={user} onLogout={onLogout} />

      <main className="quest-layout">
        <HomeSideNav
          onlineLearners={onlineLearners}
          onlinePresenceConnected={onlinePresenceConnected}
          onlinePresenceFailed={onlinePresenceFailed}
          xpData={xpData}
          xpLoading={xpLoading}
          pendingXpAnimation={pendingXpAnimation}
        />

        <section className="lesson-layout">
          <LessonPanel
            lessons={lessons}
            completedLessonIds={completedLessonIds}
            lessonsLoading={lessonsLoading}
            lessonsError={lessonsError}
            progressLoading={progressLoading}
            selectedLessonId={selectedLessonId}
            selectedTrack={selectedTrack}
            tracks={tracks}
            isProUser={isProUser}
            onLessonSelect={handleLessonSelect}
            onTrackSelect={handleTrackSelect}
          />

          <WorkspacePanel
            code={code}
            output={output}
            outputTone={outputTone}
            status={status}
            selectedLesson={selectedLesson}
            isHintLoading={isHintLoading}
            isErrorFeedbackLoading={isErrorFeedbackLoading}
            onCodeChange={setCode}
            onEditorKeyDown={handleEditorKeyDown}
            onRunCode={handleRunCode}
            onResetCode={handleResetCode}
            onShowHint={handleShowHint}
          />
        </section>
      </main>

      <LevelUpModal
        show={showLevelUpModal}
        newLevel={xpData}
        onDismiss={dismissLevelUpModal}
      />

      <MobileNavigation />
    </div>
  );
}