import { useState, useEffect, useRef } from "react";

// react-icons
import { IoSend } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";
import { FaChevronDown } from "react-icons/fa6";

// css
import styles from "./ChatRoom.module.css";

// components
import EmojiFeedback from "../EmojiFeedback/EmojiFeedback";

// context
import { useChat } from "../../context/ChatContext";

// utils
import { getCurrentUser } from "../../utils/auth";

// hooks
import { useAIHelp } from "../../CustomHooks/AIHelpHooks";

interface AvatarProps {
  isUser: boolean;
  userId: string;
  userColor?: string;
}

const Avatar = ({ isUser, userId, userColor }: AvatarProps) => (
  <div className={styles.messageAvatarBox}>
    <div className={styles.messageAvatar}>
      <FaCircleUser
        className={isUser ? styles.userAvatar : styles.otherAvatar}
        style={userColor ? { color: userColor } : undefined}
      />
    </div>
    <div className={styles.avatarIdBox}>{userId}</div>
  </div>
);

interface ChatRoomProps {
  stickyId: number;
  aiAdviceAgreed?: boolean;
}

const ChatRoom = ({ stickyId, aiAdviceAgreed = false }: ChatRoomProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [showAiAdvice, setShowAiAdvice] = useState(false);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage,
    loadMessages,
    joinStickyChat,
    leaveStickyChat,
    connectChatSocket,
  } = useChat();
  const { fetchAIAdvice, generateAIAdvice, isLoading: aiLoading } = useAIHelp();

  // AIアドバイスを手動で更新する関数（生成して保存）
  const refreshAIAdvice = async () => {
    if (!aiAdviceAgreed) return;

    setIsGeneratingAdvice(true);
    try {
      // 手動更新は「生成して保存」を実行
      const adviceResponse = await generateAIAdvice(stickyId);
      if (adviceResponse.success) {
        const text = (adviceResponse.advice || "").trim();
        setAiAdvice(text);
        setShowAiAdvice(text.length > 0);
      }
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  // 一番下にあるかチェック
  const checkIfAtBottom = () => {
    if (messageListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px 的容差
      setShowScrollButton(!isAtBottom);
    }
  };

  // 下までスクロール
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  // スクロールイベントをスパイする
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.addEventListener("scroll", checkIfAtBottom);
      return () => messageList.removeEventListener("scroll", checkIfAtBottom);
    }
  }, []);

  // メッセージが更新されたときに自動的に下までスクロールする必要があるかどうかをチェック
  useEffect(() => {
    if (messageListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      const wasAtBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (wasAtBottom) {
        scrollToBottom();
      } else {
        checkIfAtBottom();
      }
    }
  }, [messages]);

  // チャットルームの初期化
  useEffect(() => {
    const initializeChat = async () => {
      // チャットSocket接続
      connectChatSocket();

      // 既存のメッセージを読み込み
      await loadMessages(stickyId);

      // 付箋チャットに参加
      joinStickyChat(stickyId);
    };

    initializeChat();

    // クリーンアップ：チャットルームから退出
    return () => {
      leaveStickyChat(stickyId);
    };
  }, [
    stickyId,
    connectChatSocket,
    loadMessages,
    joinStickyChat,
    leaveStickyChat,
  ]); // 使用されているすべての関数が依存関係に含まれています

  // 初期表示時は「取得のみ」
  useEffect(() => {
    if (!aiAdviceAgreed) return;

    const initFetchAIAdvice = async () => {
      setIsGeneratingAdvice(true);
      try {
        const adviceResponse = await fetchAIAdvice(stickyId);
        if (adviceResponse.success) {
          const text = (adviceResponse.advice || "").trim();
          setAiAdvice(text);
          setShowAiAdvice(text.length > 0);
        }
      } finally {
        setIsGeneratingAdvice(false);
      }
    };

    initFetchAIAdvice();
  }, [stickyId, fetchAIAdvice, aiAdviceAgreed]); // stickyIdが変更された時のみ

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isGeneratingAdvice) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.error("ユーザーがログインしていません");
        return;
      }

      setIsGeneratingAdvice(true);
      try {
        await sendMessage({
          message_content: newMessage.trim(),
          student_id: currentUser.id,
          camp_id: currentUser.camp_id || 1,
          sticky_id: stickyId,
        });

        // 送信後、DBから最新メッセージを取得
        await loadMessages(stickyId);

        // メッセージ送信後は「生成して保存」→ その結果を表示（aiAdviceAgreedがtrueの場合のみ）
        if (aiAdviceAgreed) {
          setTimeout(async () => {
            const adviceResponse = await generateAIAdvice(stickyId);
            if (adviceResponse.success) {
              const text = (adviceResponse.advice || "").trim();
              setAiAdvice(text);
              setShowAiAdvice(text.length > 0);
            }
          }, 1000);
        }

        setNewMessage("");
      } finally {
        setIsGeneratingAdvice(false);
      }
    }
  };

  const currentUser = getCurrentUser();

  return (
    <div className={styles.chatContainer}>
      {/* AIアドバイス表示場所 */}
      {aiAdviceAgreed && (showAiAdvice || isGeneratingAdvice || aiLoading) && (
        <div className={styles.aiAdviceContainer}>
          <div className={styles.aiAdviceHeader}>
            <span className={styles.aiAdviceTitle}>🤖 AIアドバイス</span>
            <div className={styles.aiAdviceButtons}>
              <button
                className={styles.refreshAdviceButton}
                onClick={refreshAIAdvice}
                disabled={isGeneratingAdvice || aiLoading}
              >
                🔄
              </button>
              <button
                className={styles.closeAdviceButton}
                onClick={() => setShowAiAdvice(false)}
                disabled={isGeneratingAdvice}
              >
                ×
              </button>
            </div>
          </div>
          <div className={styles.aiAdviceContent}>
            {isGeneratingAdvice || aiLoading ? (
              <div className={styles.loadingAdvice}>
                <span>アドバイスを生成中...</span>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : (
              aiAdvice
            )}
          </div>
        </div>
      )}
      <div className={styles.messageList} ref={messageListRef}>
        {Array.isArray(messages) &&
          messages.map((message) => {
            const isUser = currentUser && message.student_id === currentUser.id;

            // 時間的フォーマット處理，エラーチェックを追加
            const formatTime = (dateString: string) => {
              try {
                if (!dateString) {
                  console.warn("時間文字列が空です、現在の時間を使用します");
                  return new Date().toLocaleTimeString("ja-JP", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }

                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                  console.warn("無効な時間文字列:", dateString);
                  return new Date().toLocaleTimeString("ja-JP", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
                return date.toLocaleTimeString("ja-JP", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } catch (error) {
                console.error(
                  "時間のフォーマットエラー:",
                  error,
                  "元の文字列:",
                  dateString
                );
                return new Date().toLocaleTimeString("ja-JP", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }
            };

            const displayTime = formatTime(message.created_at);

            return (
              <div
                key={message.message_id}
                className={`${styles.messageItem} ${
                  isUser ? styles.userMessage : styles.otherMessage
                }`}
              >
                <div className={styles.messageBox}>
                  {!isUser && (
                    <Avatar
                      isUser={false}
                      userId={message.student_id.toString()}
                      userColor={message.user_color}
                    />
                  )}
                  <div className={styles.messageContent}>
                    <div className={styles.messageTextContainer}>
                      <div className={styles.messageText}>
                        {message.message_content}
                      </div>
                      <div className={styles.emojiFeedbackContainer}>
                        <EmojiFeedback
                          messageAuthorCampId={message.camp_id}
                          stickyId={stickyId}
                          messageId={message.message_id}
                          feedback_A={message.feedback_A}
                          feedback_B={message.feedback_B}
                          feedback_C={message.feedback_C}
                          userVoteType={message.user_vote_type}
                          isUser={isUser} // isUserプロパティを追加
                        />
                      </div>
                    </div>
                    <div className={styles.messageTime}>{displayTime}</div>
                  </div>
                  {isUser && (
                    <Avatar
                      isUser={true}
                      userId={currentUser.id.toString()}
                      userColor={message.user_color}
                    />
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* 下までスクロールボタン */}
      {showScrollButton && (
        <button
          className={styles.scrollToBottomButton}
          onClick={scrollToBottom}
          aria-label="下までスクロール"
        >
          <FaChevronDown className={styles.scrollIcon} />
        </button>
      )}

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={styles.messageInput}
          disabled={isGeneratingAdvice}
          placeholder={
            isGeneratingAdvice ? "AIアドバイス生成中..." : "メッセージを入力..."
          }
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={isGeneratingAdvice || !newMessage.trim()}
        >
          <IoSend className={styles.sendIcon} />
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
