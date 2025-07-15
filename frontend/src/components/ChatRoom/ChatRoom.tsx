// react
import { useState, useEffect } from "react";

// react-icons
import { IoSend } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";

// css
import styles from "./ChatRoom.module.css";

// components
import EmojiFeedback from "../EmojiFeedback/EmojiFeedback";

// context
import { useChat } from "../../context/ChatContext";

// utils
import { getCurrentUser } from "../../utils/auth";

interface AvatarProps {
  isUser: boolean;
  userId: string;
  userColor?: string; // 追加
}

const Avatar = ({ isUser, userId, userColor }: AvatarProps) => (
  <div className={styles.messageAvatarBox}>
    <div className={styles.messageAvatar}>
      <FaCircleUser
        className={isUser ? styles.userAvatar : styles.otherAvatar}
        style={userColor ? { color: userColor } : undefined} // 追加
      />
    </div>
    <div className={styles.avatarIdBox}>{userId}</div>
  </div>
);

interface ChatRoomProps {
  stickyId: number;
}

const ChatRoom = ({ stickyId }: ChatRoomProps) => {
  const [newMessage, setNewMessage] = useState("");
  const {
    messages,
    sendMessage,
    loadMessages,
    joinStickyChat,
    leaveStickyChat,
    connectChatSocket,
  } = useChat();

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.error("ユーザーがログインしていません");
        return;
      }

      await sendMessage({
        message_content: newMessage.trim(),
        student_id: currentUser.id,
        camp_id: currentUser.camp_id || 1,
        sticky_id: stickyId,
      });

      // 送信後、DBから最新メッセージを取得
      await loadMessages(stickyId);

      setNewMessage("");
    }
  };

  const currentUser = getCurrentUser();

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.map((message) => {
          const isUser = currentUser && message.student_id === currentUser.id;

          // 時間のフォーマット処理、エラーチェックを追加
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
                    {!isUser && (
                      <div className={styles.emojiFeedbackContainer}>
                        <EmojiFeedback messageAuthorCampId={message.camp_id} />
                      </div>
                    )}
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

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={styles.messageInput}
        />
        <button type="submit" className={styles.sendButton}>
          <IoSend className={styles.sendIcon} />
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
