import { useState, useEffect, useRef } from 'react';
import { VI_MESSAGES } from '../../../content/messages';

type ChatItemContext = {
  id: number;
  title: string;
  starterCode?: string;
};

type AIChatWidgetProps = {
  chatMessages: Array<{ sender: 'user' | 'ai'; messageText: string }>;
  isChatLoading: boolean;
  selectedLesson: ChatItemContext | null;
  onSendChatMessage: (message: string) => void;
  welcomeMessage?: string;
  isChallenge?: boolean;
};

export function AIChatWidget({
  chatMessages,
  isChatLoading,
  selectedLesson,
  onSendChatMessage,
  welcomeMessage,
  isChallenge = false,
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of chat when new messages arrive or when chat is opened
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, isOpen]);

  if (!selectedLesson) return null;

  return (
    <div className="ai-chat-widget">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-chat-bubble-btn pulse-animation"
          onClick={() => setIsOpen(true)}
          title="Trò chuyện cùng Bạn AI"
        >
          <span className="ai-chat-bubble-btn__icon">🐧</span>
          <span className="ai-chat-bubble-btn__badge">1</span>
        </button>
      )}

      {/* Floating Chat Widget Overlay Card */}
      {isOpen && (
        <div className="chat-widget-card">
          <header className="chat-widget-card__header">
            <div className="chat-widget-card__header-info">
              <span className="chat-widget-card__header-avatar">🐧</span>
              <div>
                <h3 className="chat-widget-card__header-title">Bạn Cánh Cụt AI</h3>
                <span className="chat-widget-card__header-status">Đang online</span>
              </div>
            </div>
            <button
              type="button"
              className="chat-widget-card__close-btn"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="chat-widget-card__body">
            <div className="chat-messages-container">
              {chatMessages.length === 0 ? (
                <div className="chat-message chat-message--ai">
                  <div className="chat-message__mascot">🐧</div>
                  <div className="chat-message__bubble">
                    {welcomeMessage || VI_MESSAGES.home.labels.chatWelcome}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={`msg-${index}`} className={`chat-message chat-message--${msg.sender}`}>
                    {msg.sender === 'ai' && <div className="chat-message__mascot">🐧</div>}
                    <div className="chat-message__bubble">
                      {msg.messageText}
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="chat-message chat-message--ai is-loading">
                  <div className="chat-message__mascot">🐧</div>
                  <div className="chat-message__bubble">
                    <span className="material-symbols-outlined animated-spin">progress_activity</span>
                    <span style={{ marginLeft: '8px' }}>Tớ đang nghĩ...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-quick-suggestions">
              <button
                type="button"
                className="chat-suggestion-btn"
                disabled={isChatLoading}
                onClick={() => onSendChatMessage(isChallenge ? 'Giải thích mục tiêu thử thách này giúp tớ với!' : 'Giải thích mục tiêu bài học này giúp tớ với!')}
              >
                {isChallenge ? 'Giải thích thử thách' : 'Giải thích bài học'}
              </button>
              <button
                type="button"
                className="chat-suggestion-btn"
                disabled={isChatLoading}
                onClick={() => onSendChatMessage('Tớ viết code này đúng chuẩn sạch chưa? Nhận xét giúp tớ.')}
              >
                Nhận xét code
              </button>
              <button
                type="button"
                className="chat-suggestion-btn"
                disabled={isChatLoading}
                onClick={() => onSendChatMessage(isChallenge ? 'Cho tớ một ví dụ thực tế dễ hiểu về nội dung thử thách này nhé!' : 'Cho tớ một ví dụ thực tế dễ hiểu về nội dung bài này nhé!')}
              >
                Ví dụ thực tế
              </button>
            </div>

            <form
              className="chat-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('chatInput') as HTMLInputElement;
                if (input && input.value.trim()) {
                  onSendChatMessage(input.value.trim());
                  input.value = '';
                }
              }}
            >
              <input
                type="text"
                name="chatInput"
                className="chat-input-field"
                placeholder={VI_MESSAGES.home.labels.chatPlaceholder}
                autoComplete="off"
                disabled={isChatLoading}
              />
              <button type="submit" className="chat-send-btn" disabled={isChatLoading}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
