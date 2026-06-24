import { useState, useEffect, useCallback } from 'react';
import { Challenge, type ChallengeSubmitResult } from '../types/challenge';
import { usePyodideRunner } from '../../home/usePyodideRunner';
import { setCachedXp } from '../../shared/xpCache';
import { setCachedCoins } from '../../shared/coinsCache';
import { AIChatWidget } from '../../home/components/AIChatWidget';
import type { UserPet, PetAccessory } from '../../pet/types';

type ChallengeWorkspaceProps = {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (challengeId: number) => void;
  activePet?: UserPet | null;
  activeAccessories?: PetAccessory[];
};

export function ChallengeWorkspace({
  challenge,
  isOpen,
  onClose,
  onComplete,
  activePet,
  activeAccessories = [],
}: ChallengeWorkspaceProps) {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ChallengeSubmitResult | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const { status, runCode, startupMessage } = usePyodideRunner();

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; messageText: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load chat history when challenge changes
  useEffect(() => {
    if (!challenge) {
      setChatMessages([]);
      return;
    }

    const challengeId = challenge.id;
    let active = true;
    async function loadChatHistory() {
      try {
        const response = await fetch(`/api/ai/chat/history?challengeId=${challengeId}`);
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
  }, [challenge]);

  const handleSendChatMessage = useCallback(async (messageText: string) => {
    if (!challenge) return;

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
          challengeId: challenge.id,
          message: messageText,
          code,
        }),
      });

      const payload = (await response.json()) as { message?: string };
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
  }, [challenge, code]);

  // Reset code when challenge changes
  useEffect(() => {
    if (challenge) {
      setCode(challenge.starterCode);
      setOutput('');
      setResult(null);
    }
  }, [challenge]);

  const handleRun = useCallback(async () => {
    if (!code.trim() || status === 'running') return;

    setOutput('Đang chạy...\n');

    const runResult = await runCode(code);

    if (runResult.kind === 'error') {
      setOutput(`Lỗi:\n${runResult.output}`);
    } else {
      setOutput(runResult.output || '(Không có output)');
    }
  }, [code, status, runCode]);

  const handleSubmit = useCallback(async () => {
    if (!challenge || isSubmitting) return;

    // Validate code with test cases before submitting
    if (challenge.testCases && challenge.testCases.length > 0) {
      const errors: string[] = [];

      for (let i = 0; i < challenge.testCases.length; i++) {
        const testCase = challenge.testCases[i];
        const runResult = await runCode(code);

        if (runResult.kind === 'error') {
          errors.push(`Test ${i + 1}: Lỗi khi chạy code - ${runResult.output}`);
        } else {
          const actualOutput = runResult.output.trim();
          const expectedOutput = testCase.expectedOutput.trim();

          if (actualOutput !== expectedOutput) {
            errors.push(
              `Test ${i + 1} thất bại!\nKết quả của bạn:\n${actualOutput || '(Không có output)'}\n\nKết quả mong đợi:\n${expectedOutput}`
            );
          }
        }

        // Stop checking more tests if we already have errors (show first failure)
        if (errors.length > 0) {
          setOutput(`${errors[0]}\n\nHãy chỉnh sửa code và thử lại!`);
          return;
        }
      }

      // All tests passed - user can continue to submit
      setOutput('Tất cả test đã pass! Đang nộp bài...');
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);

        // Update cache - only add XP/coins if not already completed
        if (data.xpData) {
          setCachedXp(data.xpData);
        }

        // Update coins in cache
        if (!data.alreadyCompleted && typeof data.totalCoins === 'number') {
          setCachedCoins(data.totalCoins);
        }

        // Build reward message
        let rewardMsg = data.message;
        if (!data.alreadyCompleted) {
          rewardMsg += `\n\n+${data.xpEarned} XP\n+${data.coinsEarned} Coins`;
          // Show reward popup
          setShowRewardPopup(true);
        } else {
          rewardMsg += '\n\nKhông có phần thưởng (đã hoàn thành trước đó)';
        }
        setOutput(rewardMsg);

        // Show reward animation if new completion
        if (!data.alreadyCompleted) {
          setShowRewardAnimation(true);
          setTimeout(() => setShowRewardAnimation(false), 2000);
          onComplete?.(challenge.id);
        }
      } else {
        setOutput(data.message || 'Có lỗi xảy ra');
      }
    } catch {
      setOutput('Không thể kết nối đến server');
    } finally {
      setIsSubmitting(false);
    }
  }, [challenge, code, isSubmitting, runCode, onComplete]);

  const handleClose = useCallback(() => {
    setCode('');
    setOutput('');
    setResult(null);
    setShowRewardPopup(false);
    onClose();
  }, [onClose]);

  if (!isOpen || !challenge) return null;

  return (
    <>
      {/* Reward Popup */}
      {showRewardPopup && (
        <div className="challenge-reward-popup">
          <div className="challenge-reward-popup__backdrop" />
          <div className="challenge-reward-popup__card">
            <div className="challenge-reward-popup__icon">
              <span className="material-symbols-outlined">celebration</span>
            </div>
            <h2 className="challenge-reward-popup__title">Hoàn thành!</h2>
            <p className="challenge-reward-popup__message">{challenge.title}</p>
            <div className="challenge-reward-popup__rewards">
              <div className="challenge-reward-popup__reward challenge-reward-popup__reward--xp">
                <span className="material-symbols-outlined">star</span>
                <span>+{result?.xpEarned ?? 0} XP</span>
              </div>
              <div className="challenge-reward-popup__reward challenge-reward-popup__reward--coins">
                <span className="material-symbols-outlined">monetization_on</span>
                <span>+{result?.coinsEarned ?? 0} Coins</span>
              </div>
            </div>
            <button
              type="button"
              className="pressable challenge-reward-popup__close"
              onClick={() => setShowRewardPopup(false)}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      <div className="challenge-workspace-overlay" onClick={handleClose}>
        <div className="challenge-workspace-modal" onClick={(e) => e.stopPropagation()}>
          <header className="challenge-workspace__header">
            <div className="challenge-workspace__title-row">
              <h2 className="challenge-workspace__title">{challenge.title}</h2>
              <span className={`challenge-workspace__difficulty challenge-workspace__difficulty--${challenge.difficulty}`}>
                {challenge.difficulty === 'easy' ? 'Dễ' : challenge.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
              </span>
            </div>
            <p className="challenge-workspace__description" dangerouslySetInnerHTML={{ __html: challenge.description }} />
            <div className="challenge-workspace__rewards">
              <span className="challenge-workspace__reward">
                <span className="material-symbols-outlined">star</span>
                +{challenge.xpReward} XP
              </span>
              <span className="challenge-workspace__reward">
                <span className="material-symbols-outlined">monetization_on</span>
                +{challenge.coinsReward} Coins
              </span>
            </div>
          </header>

          <div className="challenge-workspace__editor">
            <div className="workspace-panel">
              <div className="workspace-panel__header">
                <span className="material-symbols-outlined">code</span>
                <span>Python</span>
              </div>
              <textarea
                className="workspace-panel__code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Viết code Python ở đây..."
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                data-gramm="false"
                disabled={result?.success && !result.alreadyCompleted}
              />
            </div>

            <div className={`workspace-panel workspace-panel--output ${showRewardAnimation ? 'workspace-panel--reward' : ''}`}>
              <div className="workspace-panel__header">
                <span className="material-symbols-outlined">terminal</span>
                <span>Output</span>
              </div>
              <pre className="workspace-panel__output">{output || startupMessage}</pre>
            </div>
          </div>

          <footer className="challenge-workspace__footer">
            <button
              type="button"
              className="pressable challenge-workspace__btn challenge-workspace__btn--secondary"
              onClick={handleRun}
              disabled={status === 'loading' || status === 'running'}
            >
              <span className="material-symbols-outlined">play_arrow</span>
              {status === 'running' ? 'Đang chạy...' : 'Chạy thử'}
            </button>

            {!result?.success || result.alreadyCompleted ? (
              <button
                type="button"
                className="pressable challenge-workspace__btn challenge-workspace__btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <span className="material-symbols-outlined">check</span>
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            ) : (
              <button
                type="button"
                className="pressable challenge-workspace__btn challenge-workspace__btn--success"
                onClick={handleClose}
              >
                <span className="material-symbols-outlined">close</span>
                Đóng
              </button>
            )}
          </footer>
        </div>
      </div>

      <AIChatWidget
        chatMessages={chatMessages}
        isChatLoading={isChatLoading}
        selectedLesson={challenge}
        onSendChatMessage={handleSendChatMessage}
        welcomeMessage="Chào cậu! Tớ là bạn Cánh Cụt học Python. Cậu cần tớ trợ giúp gì về thử thách này không? Hihi!"
        isChallenge={true}
        activePet={activePet}
        activeAccessories={activeAccessories}
      />
    </>
  );
}
