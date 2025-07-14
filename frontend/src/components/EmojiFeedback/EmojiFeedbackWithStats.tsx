// react
import React, { useState, useEffect, useMemo } from "react";

// react-icons
import {
  BsFillEmojiSmileFill,
  BsFillEmojiNeutralFill,
  BsFillEmojiFrownFill,
} from "react-icons/bs";

// css
import styles from "./EmojiFeedbackWithStats.module.css";

// utils
import { getCurrentUser } from "../../utils/auth";

interface EmojiStats {
  happy: number; // feedback_A
  neutral: number; // feedback_B
  sad: number; // feedback_C
}

interface VoteStatus {
  voted: boolean;
  vote_type: string | null;
  can_vote: boolean;
}

interface EmojiFeedbackWithStatsProps {
  stats: EmojiStats;
  stickyId: number;
  stickyAuthorId: number;
  stickyAuthorCampId: number | null;
  onStatsUpdate?: (newStats: EmojiStats) => void;
}

const EmojiFeedbackWithStats: React.FC<EmojiFeedbackWithStatsProps> = ({
  stats,
  stickyId,
  stickyAuthorId,
  stickyAuthorCampId,
  onStatsUpdate,
}) => {
  const [currentStats, setCurrentStats] = useState(stats);
  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({
    voted: false,
    vote_type: null,
    can_vote: false,
  });

  const currentUser = getCurrentUser();
  const canVote = useMemo(
    () => currentUser && currentUser.id !== stickyAuthorId,
    [currentUser, stickyAuthorId]
  );

  // 同じ陣営かどうかを判断
  const isSameTeam = useMemo(() => {
    return (
      currentUser &&
      stickyAuthorCampId &&
      currentUser.camp_id === stickyAuthorCampId
    );
  }, [currentUser, stickyAuthorCampId]);

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

  // 外部のstats変化を同期
  useEffect(() => {
    setCurrentStats(stats);
  }, [stats]);

  // 初回ロード時のみ投票状況を取得
  useEffect(() => {
    const fetchInitialVoteStatus = async () => {
      if (!currentUser || currentUser.id === stickyAuthorId) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/sticky/${stickyId}/vote-status/${currentUser.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setVoteStatus(data);
        }
      } catch (error) {
        console.error("投票状態の取得に失敗しました:", error);
      }
    };

    fetchInitialVoteStatus();
  }, [stickyId]); // stickyIdが変わった時のみ実行

  const emojiData = [
    {
      type: "happy" as const,
      icon: BsFillEmojiSmileFill,
      color: "#70b02c",
      count: currentStats.happy,
      feedbackType: "A" as const, // feedback_A
    },
    {
      type: "neutral" as const,
      icon: BsFillEmojiNeutralFill,
      color: "#ffc84a",
      count: currentStats.neutral,
      feedbackType: "B" as const, // feedback_B
    },
    {
      type: "sad" as const,
      icon: BsFillEmojiFrownFill,
      color: "#ff441f",
      count: currentStats.sad,
      feedbackType: "C" as const, // feedback_C
    },
  ];

  const handleEmojiClick = async (feedbackType: string) => {
    if (!canVote || !currentUser || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/sticky/${stickyId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: currentUser.id,
            feedback_type: feedbackType,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newStats = {
          happy: data.feedback_counts.feedback_A,
          neutral: data.feedback_counts.feedback_B,
          sad: data.feedback_counts.feedback_C,
        };
        setCurrentStats(newStats);
        onStatsUpdate?.(newStats);

        // 投票状況を更新
        try {
          const statusResponse = await fetch(
            `http://localhost:5000/api/sticky/${stickyId}/vote-status/${currentUser.id}`
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setVoteStatus(statusData);
          }
        } catch (statusError) {
          console.error("投票状況の更新に失敗:", statusError);
        }
      } else {
        const error = await response.json();
        console.error("フィードバック投票エラー:", error.error);
      }
    } catch (error) {
      console.error("フィードバック投票に失敗しました:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={styles.emojiFeedbackStats}>
      <div className={styles.statsContainer}>
        {emojiData.map((emoji) => {
          const IconComponent = emoji.icon;
          const isCurrentVote =
            canVote &&
            voteStatus.voted &&
            voteStatus.vote_type === emoji.feedbackType;
          const isClickable = canVote && voteStatus.can_vote;

          return (
            <div
              key={emoji.type}
              className={`${styles.emojiStatItem} ${
                isClickable ? styles.clickable : styles.viewOnly
              } ${isCurrentVote ? styles.currentVote : ""}`}
              style={{
                color: emoji.color,
              }}
              onClick={() =>
                isClickable && handleEmojiClick(emoji.feedbackType)
              }
              title={
                isCurrentVote
                  ? `${getFeedbackMessage(emoji.feedbackType)} `
                  : isClickable
                  ? `${getFeedbackMessage(emoji.feedbackType)}`
                  : ""
              }
            >
              <IconComponent className={styles.emojiIcon} />
              <span className={styles.count}>{emoji.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiFeedbackWithStats;
