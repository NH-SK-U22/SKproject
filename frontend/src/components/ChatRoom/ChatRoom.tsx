// react
import { useState } from "react";

// react-icons
import { IoSend } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";

// css
import styles from "./ChatRoom.module.css";

// components
import EmojiFeedback from "../EmojiFeedback/EmojiFeedback";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface AvatarProps {
  isUser: boolean;
  userId: string;
}

const Avatar = ({ isUser, userId }: AvatarProps) => (
  <div className={styles.messageAvatarBox}>
    <div className={styles.messageAvatar}>
      <FaCircleUser
        className={isUser ? styles.userAvatar : styles.otherAvatar}
      />
    </div>
    <div className={styles.avatarIdBox}>{userId}</div>
  </div>
);

const ChatRoom = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        text: newMessage.trim(),
        isUser: true,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageItem} ${
              message.isUser ? styles.userMessage : styles.otherMessage
            }`}
          >
            <div className={styles.messageBox}>
              {!message.isUser && <Avatar isUser={false} userId="1234" />}
              <div className={styles.messageContent}>
                <div className={styles.messageTextContainer}>
                  <div className={styles.messageText}>{message.text}</div>
                  {!message.isUser && (
                    <div className={styles.emojiFeedbackContainer}>
                      <EmojiFeedback />
                    </div>
                  )}
                </div>
                <div className={styles.messageTime}>{message.timestamp}</div>
              </div>
              {message.isUser && <Avatar isUser={true} userId="5678" />}
            </div>
          </div>
        ))}
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
