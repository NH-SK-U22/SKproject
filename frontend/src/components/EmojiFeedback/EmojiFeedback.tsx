// react
import React, { useState, useMemo, useEffect } from "react";

// react-icons
import {
  BsFillEmojiSmileFill,
  BsFillEmojiNeutralFill,
  BsFillEmojiFrownFill,
} from "react-icons/bs";

// css
import styles from "./EmojiFeedback.module.css";

// utils
import { getCurrentUser } from "../../utils/auth";

// hooks
import { useRoomVote } from "../../CustomHooks/RoomVoteHooks";

interface EmojiOption {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  feedbackType: string;
  count: number;
}

interface EmojiFeedbackProps {
  messageAuthorCampId?: number;
  stickyId: number;
  messageId: number;
  feedback_A?: number;
  feedback_B?: number;
  feedback_C?: number;
  userVoteType?: string; // ユーザーの投票タイプを追加
  isUser?: boolean; // isUserプロパティを追加
}

const EmojiFeedback: React.FC<EmojiFeedbackProps> = ({
  messageAuthorCampId,
  stickyId,
  messageId,
  feedback_A = 0,
  feedback_B = 0,
  feedback_C = 0,
  userVoteType,
  isUser = false, // デフォルト値を設定
}) => {
  const [clickedEmoji, setClickedEmoji] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [localVoteType, setLocalVoteType] = useState<string | undefined>(
    userVoteType
  );
  // ローカルでfeedback数を管理
  const [localFeedbackCounts, setLocalFeedbackCounts] = useState({
    A: feedback_A,
    B: feedback_B,
    C: feedback_C,
  });

  const currentUser = getCurrentUser();
  const { submitRoomVote, isLoading } = useRoomVote();

  // userVoteTypeが変更されたらlocalVoteTypeを更新
  useEffect(() => {
    setLocalVoteType(userVoteType);
  }, [userVoteType]);

  // 外部から渡されたfeedback数が変更されたらローカル状態を更新
  useEffect(() => {
    setLocalFeedbackCounts({
      A: feedback_A,
      B: feedback_B,
      C: feedback_C,
    });
  }, [feedback_A, feedback_B, feedback_C]);

  // 同じ陣営かどうかを判断
  const isSameTeam = useMemo(() => {
    return (
      currentUser &&
      messageAuthorCampId &&
      currentUser.camp_id === messageAuthorCampId
    );
  }, [currentUser, messageAuthorCampId]);

  // フィードバックメッセージを取得
  const getFeedbackMessage = (feedbackType: string) => {
    if (isSameTeam) {
      // 同じ陣営
      switch (feedbackType) {
        case "A":
          return "めっちゃ共感！";
        case "B":
          return "なるほどね";
        case "C":
          return "それはちょっと違うんじゃない";
        default:
          return "";
      }
    } else {
      // 敵陣営
      switch (feedbackType) {
        case "A":
          return "意見が変わるくらい納得";
        case "B":
          return "意見は変わらんけど興味深い";
        case "C":
          return "そうは思わないな";
        default:
          return "";
      }
    }
  };

  const emojis: EmojiOption[] = [
    {
      icon: BsFillEmojiSmileFill,
      label: getFeedbackMessage("A"),
      color: "green",
      feedbackType: "A",
      count: localFeedbackCounts.A,
    },
    {
      icon: BsFillEmojiNeutralFill,
      label: getFeedbackMessage("B"),
      color: "yellow",
      feedbackType: "B",
      count: localFeedbackCounts.B,
    },
    {
      icon: BsFillEmojiFrownFill,
      label: getFeedbackMessage("C"),
      color: "red",
      feedbackType: "C",
      count: localFeedbackCounts.C,
    },
  ];

  const handleEmojiClick = async (feedbackType: string) => {
    // isUserの場合は何もしない
    if (isUser || !currentUser || isLoading) return;

    // 既に選択されているものを再度クリックした場合は何もしない
    if (localVoteType === feedbackType) return;

    // 新しい選択を行った際は、既存の選択状態をクリアするため
    // ローカル状態を即座に更新して古い強調マークを消す
    setLocalVoteType(feedbackType);

    // 即座にクリック状態を設定
    setClickedEmoji(feedbackType);

    try {
      const voteData = {
        sticky_id: stickyId,
        message_id: messageId,
        voter_id: currentUser.id,
        school_id: currentUser.school_id,
        vote_type: feedbackType,
      };

      const result = await submitRoomVote(voteData);
      if (!result.success) {
        console.error("投票エラー:", result.message);
        // エラーの場合はクリック状態をリセットし、ローカル状態も元に戻す
        setClickedEmoji(null);
        setLocalVoteType(userVoteType);
      } else {
        // 投票成功時は、既存の投票を削除した場合は-1、新しい投票の場合は+1
        setLocalFeedbackCounts((prev) => {
          const newCounts = { ...prev };

          // 既存の投票があれば削除
          if (localVoteType) {
            newCounts[localVoteType as keyof typeof newCounts]--;
          }

          // 新しい投票を追加
          newCounts[feedbackType as keyof typeof newCounts]++;

          return newCounts;
        });
      }
    } catch (error) {
      console.error("投票に失敗しました:", error);
      // エラーの場合はクリック状態をリセットし、ローカル状態も元に戻す
      setClickedEmoji(null);
      setLocalVoteType(userVoteType);
    }
  };

  return (
    <div
      className={`${styles.emojiFeedback} ${isUser ? styles.userMessage : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`${styles.emojiContainer} ${
          isHovered ? styles.expanded : ""
        }`}
      >
        {emojis.map((item) => {
          const IconComponent = item.icon;
          const isSelected = localVoteType === item.feedbackType;
          const isClicked = clickedEmoji === item.feedbackType;

          return (
            <>
              <button
                key={item.feedbackType}
                onClick={() => handleEmojiClick(item.feedbackType)}
                className={`${styles.emojiButton} ${
                  isSelected && isHovered ? styles.selected : ""
                } ${isClicked && isHovered ? styles.clicked : ""}`}
                title={isHovered ? item.label : ""}
                data-color={item.color}
                disabled={isUser} // isUserの場合はボタンを無効化
              >
                <IconComponent className={styles.emojiIcon} />
              </button>
              {isHovered && (
                <span className={styles.emojiCount} data-color={item.color}>
                  {item.count}
                </span>
              )}
            </>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiFeedback;
