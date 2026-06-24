import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { VI_MESSAGES } from '../../content/messages';
import type { AuthUser } from '../auth/types';
import { LessonPanel } from './components/LessonPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { LevelUpModal } from './components/LevelUpModal';
import { useLessons, type Lesson } from './useLessons';
import { useLessonProgress } from './useLessonProgress';
import { usePyodideRunner } from './usePyodideRunner';
import { useXP, type XpResponse } from './useXP';
import { playCelebrationChime } from '../shared/soundEffects';
import { setCachedCoins } from '../shared/coinsCache';
import { AIChatWidget } from './components/AIChatWidget';
import type { UserPet, PetAccessory } from '../pet';

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

function stripPythonComments(source: string) {
  return source
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        return '';
      }

      const commentIndex = line.indexOf('#');
      if (commentIndex === -1) {
        return line;
      }

      return line.slice(0, commentIndex);
    })
    .join('\n');
}

type HomePageProps = {
  user: AuthUser;
  activePet: UserPet | null;
  activeAccessories?: PetAccessory[];
  isStreakExcited: boolean;
  onFeedPet: () => Promise<void> | void;
  onOpenShop?: () => void;
  onLogout?: () => Promise<void> | void;
  onNavigatePractice?: () => void;
};

export function HomePage({
  user,
  activePet,
  activeAccessories = [],
  isStreakExcited,
  onFeedPet,
  onOpenShop,
}: HomePageProps) {
  const { lessons, loading: lessonsLoading, error: lessonsError } = useLessons();
  const { completedLessonIds, loading: progressLoading, markLessonCompleted } = useLessonProgress();
  const { runCode, startupMessage, status } = usePyodideRunner();
  const {
    xpData,
    showLevelUpModal,
    recordFirstSuccess,
    animateAndCacheXp,
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
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [lastRuntimeFeedback, setLastRuntimeFeedback] = useState<RuntimeFeedback>(null);
  const previousCompletedLessonCountRef = useRef<number | null>(null);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; messageText: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);


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

  useEffect(() => {
    if (previousCompletedLessonCountRef.current === null) {
      previousCompletedLessonCountRef.current = completedLessonIds.length;
      return;
    }

    if (completedLessonIds.length > previousCompletedLessonCountRef.current) {
      playCelebrationChime({
        enabled: user.musicEnabled ?? true,
        volume: user.soundVolume ?? 80,
      });
    }

    previousCompletedLessonCountRef.current = completedLessonIds.length;
  }, [completedLessonIds.length, user.musicEnabled, user.soundVolume]);

  // Load chat history when selected lesson changes
  useEffect(() => {
    if (!selectedLessonId) {
      setChatMessages([]);
      return;
    }

    let active = true;
    async function loadChatHistory() {
      try {
        const response = await fetch(`/api/ai/chat/history?lessonId=${selectedLessonId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (active) {
          setChatMessages(
            (data.messages || []).map((msg: { sender: 'user' | 'ai'; messageText: string }) => ({
              sender: msg.sender,
              messageText: msg.messageText,
            }))
          );
        }
      } catch {
        // Fail silently
      }
    }

    void loadChatHistory();

    return () => {
      active = false;
    };
  }, [selectedLessonId]);

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
      return stripPythonComments(currentCode).includes(lesson.completionCheckValue);
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

    if (result.kind !== 'success' || !selectedLesson) {
      return;
    }

    if (completedLessonIds.includes(selectedLesson.id)) {
      return;
    }

    const passedCompletionCheck = doesLessonPassCompletionCheck(selectedLesson, code, result.output);
    if (!passedCompletionCheck) {
      setOutput(
        `${result.output}\n\nChưa được tính hoàn thành bài học.\nHãy kiểm tra lại yêu cầu của bài và đảm bảo kết quả hoặc mã của bạn khớp mục tiêu.`,
      );
      return;
    }

    try {
      await markLessonCompleted(selectedLesson.id);
      setOutput(VI_MESSAGES.home.output.completedLesson(selectedLesson.title, result.output));
    } catch (error) {
      setOutput(
        `${result.output}\n\nĐã chạy đúng nhưng chưa thể lưu trạng thái hoàn thành.\n${
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu tiến độ.'
        }`,
      );
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

  async function handleShowCodeReview() {
    if (!selectedLesson) {
      setOutputTone('error');
      setOutput(VI_MESSAGES.home.output.selectLessonForHint);
      return;
    }

    setIsReviewLoading(true);
    setOutputTone('idle');
    setOutput(VI_MESSAGES.home.output.askingReview);

    try {
      const response = await fetch('/api/ai/review-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          code,
        }),
      });

      const payload = (await response.json()) as {
        reviewText?: string;
        alreadyRewarded?: boolean;
        coinsEarned?: number;
        xpEarned?: number;
        totalCoins?: number;
        xpData?: XpResponse;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || VI_MESSAGES.home.output.reviewFetchFailed);
      }

      setOutputTone('success');
      
      const rewardMessage = !payload.alreadyRewarded && payload.coinsEarned && payload.xpEarned
        ? `\n\n${VI_MESSAGES.home.output.reviewReward(payload.coinsEarned, payload.xpEarned)}`
        : '';

      setOutput(`${VI_MESSAGES.home.output.reviewTitle}\n\n${payload.reviewText || ''}${rewardMessage}`);

      if (!payload.alreadyRewarded) {
        if (typeof payload.totalCoins === 'number') {
          setCachedCoins(payload.totalCoins);
        }
        if (payload.xpData) {
          animateAndCacheXp(payload.xpData);
        }
      }
    } catch (error) {
      setOutputTone('error');
      setOutput(error instanceof Error ? error.message : VI_MESSAGES.home.output.reviewFetchFailed);
    } finally {
      setIsReviewLoading(false);
    }
  }

  async function handleSendChatMessage(messageText: string) {
    if (!selectedLesson) return;

    const newUserMsg = { sender: 'user' as const, messageText };
    setChatMessages((prev) => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          message: messageText,
          code,
        }),
      });

      const payload = (await response.json()) as { message?: string; messageText?: string };
      if (!response.ok) {
        throw new Error(payload.message || 'Không gửi được tin nhắn.');
      }

      const aiMsg = { sender: 'ai' as const, messageText: payload.message || '' };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = {
        sender: 'ai' as const,
        messageText: error instanceof Error ? error.message : 'Tớ gặp chút sự cố mạng rồi, cậu thử lại nhé!',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
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
    <>
      <main className="quest-layout">
        {/* TopBar and SideNav are already rendered in App.tsx */}

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
            activePet={activePet}
            activeAccessories={activeAccessories}
            isStreakExcited={isStreakExcited}
            onFeedPet={onFeedPet}
            onOpenShop={onOpenShop}
          />

          <WorkspacePanel
            code={code}
            output={output}
            outputTone={outputTone}
            status={status}
            selectedLesson={selectedLesson}
            isHintLoading={isHintLoading}
            isErrorFeedbackLoading={isErrorFeedbackLoading}
            isReviewLoading={isReviewLoading}
            onCodeChange={setCode}
            onEditorKeyDown={handleEditorKeyDown}
            onRunCode={handleRunCode}
            onResetCode={handleResetCode}
            onShowHint={handleShowHint}
            onShowCodeReview={handleShowCodeReview}
          />
        </section>
      </main>

      <LevelUpModal
        show={showLevelUpModal}
        newLevel={xpData}
        onDismiss={dismissLevelUpModal}
      />

      <AIChatWidget
        chatMessages={chatMessages}
        isChatLoading={isChatLoading}
        selectedLesson={selectedLesson}
        onSendChatMessage={handleSendChatMessage}
        activePet={activePet}
        activeAccessories={activeAccessories}
      />


    </>
  );
}
