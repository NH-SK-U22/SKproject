// react
import React, { useState, useMemo } from "react";

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

interface EmojiOption {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  feedbackType: string;
}

interface EmojiFeedbackProps {
  messageAuthorCampId?: number;
}

const EmojiFeedback: React.FC<EmojiFeedbackProps> = ({
  messageAuthorCampId,
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const currentUser = getCurrentUser();

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
    },
    {
      icon: BsFillEmojiNeutralFill,
      label: getFeedbackMessage("B"),
      color: "yellow",
      feedbackType: "B",
    },
    {
      icon: BsFillEmojiFrownFill,
      label: getFeedbackMessage("C"),
      color: "red",
      feedbackType: "C",
    },
  ];

  const handleEmojiClick = (label: string) => {
    setSelectedEmoji(label);
  };

  // hover時に表示するemojiを決定
  const getDisplayEmojis = () => {
    if (!selectedEmoji || isHovered) {
      // 未選択またはhover時にすべてのemojiを表示
      return emojis;
    } else {
      // 選択後に選択されたemojiのみを表示
      return emojis.filter((emoji) => emoji.label === selectedEmoji);
    }
  };

  return (
    <div className={styles.emojiFeedback}>
      <div
        className={`${styles.emojiContainer} ${
          selectedEmoji && !isHovered ? styles.selectedMode : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getDisplayEmojis().map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleEmojiClick(item.label)}
              className={`${styles.emojiButton} ${
                selectedEmoji === item.label ? styles.selected : ""
              }`}
              title={item.label}
              data-color={item.color}
            >
              <IconComponent className={styles.emojiIcon} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiFeedback;
