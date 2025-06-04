// react
import React, { useState } from "react";

// react-icons
import {
  BsFillEmojiSmileFill,
  BsFillEmojiNeutralFill,
  BsFillEmojiFrownFill,
} from "react-icons/bs";

// css
import styles from "./EmojiFeedback.module.css";

interface EmojiOption {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

const EmojiFeedback: React.FC = () => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const emojis: EmojiOption[] = [
    { icon: BsFillEmojiSmileFill, label: "いいね", color: "green" },
    { icon: BsFillEmojiNeutralFill, label: "普通", color: "yellow" },
    { icon: BsFillEmojiFrownFill, label: "不満", color: "red" },
  ];

  const handleEmojiClick = (label: string) => {
    setSelectedEmoji(label);
  };

  // 根据选中状态和hover状态决定显示哪些emoji
  const getDisplayEmojis = () => {
    if (!selectedEmoji || isHovered) {
      // 未选中或hover时显示所有选项
      return emojis;
    } else {
      // 选中后只显示选中的emoji
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
