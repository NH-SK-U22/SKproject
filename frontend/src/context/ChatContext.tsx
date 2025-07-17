import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  message_id: number;
  student_id: number;
  message_content: string;
  camp_id: number;
  sticky_id: number;
  feedback_A: number;
  feedback_B: number;
  feedback_C: number;
  created_at: string;
  student_name: string;
  student_number: string;
  user_color: string;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (message: {
    message_content: string;
    student_id: number;
    camp_id: number;
    sticky_id: number;
  }) => Promise<void>;
  loadMessages: (sticky_id: number) => Promise<void>;
  joinStickyChat: (sticky_id: number) => void;
  leaveStickyChat: (sticky_id: number) => void;
  connectChatSocket: () => void;
  disconnectChatSocket: () => void;
  currentStickyId: number | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStickyId, setCurrentStickyId] = useState<number | null>(null);
  const chatSocketRef = useRef<Socket | null>(null);

  // 特定の付箋のメッセージを読み込む
  const loadMessages = useCallback(async (sticky_id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/message/sticky/${sticky_id}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("バックエンドから返されたメッセージデータ:", data);
        setMessages(data);
        setCurrentStickyId(sticky_id);
      } else {
        console.error("メッセージの読み込みに失敗しました");
      }
    } catch (error) {
      console.error("メッセージの読み込みエラー:", error);
    }
  }, []);

  // メッセージを送信（Socket.IO経由）
  const sendMessage = useCallback(
    async (message: {
      message_content: string;
      student_id: number;
      camp_id: number;
      sticky_id: number;
    }) => {
      const currentTime = new Date().toISOString();
      const optimisticMessage: Message = {
        message_id: Date.now(),
        student_id: message.student_id,
        message_content: message.message_content,
        camp_id: message.camp_id,
        sticky_id: message.sticky_id,
        feedback_A: 0,
        feedback_B: 0,
        feedback_C: 0,
        created_at: currentTime,
        student_name: "",
        student_number: "",
      };

      console.log(
        "メッセージ送信時間:",
        currentTime,
        "結果:",
        new Date(currentTime)
      );

      // すぐにローカル状態を更新
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        if (chatSocketRef.current && chatSocketRef.current.connected) {
          // Socket.IO経由でメッセージを送信
          chatSocketRef.current.emit("send_message", message);
          console.log("メッセージをSocket経由で送信しました:", message);
        } else {
          // Socketが利用できない場合、HTTP APIを使用
          console.log("Socket未接続、HTTP APIを使用します");
          const response = await fetch("http://localhost:5000/api/message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          });

          if (response.ok) {
            const savedMessage = await response.json();
            // 実際のメッセージで更新を置き換え
            setMessages((prev) =>
              prev.map((msg) =>
                msg.message_id === optimisticMessage.message_id
                  ? { ...savedMessage, ...message }
                  : msg
              )
            );
            console.log("HTTPでメッセージが送信されました");
          } else {
            // 送信に失敗した場合、更新を削除
            setMessages((prev) =>
              prev.filter(
                (msg) => msg.message_id !== optimisticMessage.message_id
              )
            );
            console.error("HTTPメッセージ送信に失敗しました");
          }
        }
      } catch (error) {
        console.error("メッセージ送信エラー:", error);
        // 送信に失敗した場合、更新を削除
        setMessages((prev) =>
          prev.filter((msg) => msg.message_id !== optimisticMessage.message_id)
        );
      }
    },
    []
  );

  // 付箋チャットに参加
  const joinStickyChat = useCallback((sticky_id: number) => {
    if (chatSocketRef.current && chatSocketRef.current.connected) {
      chatSocketRef.current.emit("join_sticky_chat", { sticky_id });
      console.log(`付箋チャットに参加しました: sticky_${sticky_id}`);
      setCurrentStickyId(sticky_id);
    }
  }, []);

  // 付箋チャットから退出
  const leaveStickyChat = useCallback((sticky_id: number) => {
    if (chatSocketRef.current && chatSocketRef.current.connected) {
      chatSocketRef.current.emit("leave_sticky_chat", { sticky_id });
      console.log(`付箋チャットから退出しました: sticky_${sticky_id}`);
    }
  }, []);

  // チャットSocket接続
  const connectChatSocket = useCallback(() => {
    if (chatSocketRef.current) {
      return; // 既に接続されている場合は何もしない
    }

    chatSocketRef.current = io("http://localhost:5000", {
      transports: ["polling"],
      upgrade: false,
      rememberUpgrade: false,
    });

    chatSocketRef.current.on("connect", () => {
      console.log("Chat Socket connected");
    });

    chatSocketRef.current.on("disconnect", () => {
      console.log("Chat Socket disconnected");
    });

    chatSocketRef.current.on("connect_error", (error) => {
      console.error("Chat Socket connection error:", error);
    });

    // 新しいメッセージを受信
    chatSocketRef.current.on("message_sent", (data: Message) => {
      console.log("Socket: 新しいメッセージを受信しました", data);
      // 現在表示しているメッセージと同じsticky_idの場合のみ追加
      setMessages((prev) => {
        // 現在のメッセージリストが空でない場合、最初のメッセージのsticky_idと比較
        if (prev.length > 0 && prev[0].sticky_id !== data.sticky_id) {
          return prev; // 異なるsticky_idの場合は追加しない
        }

        // 同じ内容と時間のメッセージが見つかった場合、サーバーから返されたメッセージで置き換え
        const optimisticMessageIndex = prev.findIndex(
          (msg) =>
            msg.message_content === data.message_content &&
            msg.student_id === data.student_id &&
            msg.sticky_id === data.sticky_id &&
            msg.message_id > 1000000000000
        );

        if (optimisticMessageIndex !== -1) {
          // 更新を置き換え
          const newMessages = [...prev];
          newMessages[optimisticMessageIndex] = data;
          return newMessages;
        }

        // メッセージが既に存在するかどうかを確認（重複を防ぐ）
        const exists = prev.some((msg) => msg.message_id === data.message_id);
        if (exists) return prev;
        return [...prev, data];
      });
    });
  }, []); // 依存項を空にする

  // チャットSocket接続を切断
  const disconnectChatSocket = useCallback(() => {
    if (chatSocketRef.current) {
      if (currentStickyId) {
        chatSocketRef.current.emit("leave_sticky_chat", {
          sticky_id: currentStickyId,
        });
      }
      chatSocketRef.current.disconnect();
      chatSocketRef.current = null;
    }
    setCurrentStickyId(null);
  }, [currentStickyId]);

  // コンポーネントがアンロードされた時にSocket接続を切断
  useEffect(() => {
    return () => {
      disconnectChatSocket();
    };
  }, [disconnectChatSocket]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        loadMessages,
        joinStickyChat,
        leaveStickyChat,
        connectChatSocket,
        disconnectChatSocket,
        currentStickyId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("ChatProvider内でuseChatを使用してください");
  }
  return context;
};
