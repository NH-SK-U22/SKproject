// react
import React from "react";

// react-icons
import {
  BsFillEmojiSmileFill,
  BsFillEmojiNeutralFill,
  BsFillEmojiFrownFill,
} from "react-icons/bs";

// css
import styles from "./EmojiFeedbackWithStats.module.css";

interface EmojiStats {
  happy: number;
  neutral: number;
  sad: number;
}

interface EmojiFeedbackWithStatsProps {
  stats: EmojiStats;
}

const EmojiFeedbackWithStats: React.FC<EmojiFeedbackWithStatsProps> = ({
  stats,
}) => {
  const emojiData = [
    {
      type: "happy" as const,
      icon: BsFillEmojiSmileFill,
      color: "#70b02c",
      count: stats.happy,
    },
    {
      type: "neutral" as const,
      icon: BsFillEmojiNeutralFill,
      color: "#ffc84a",
      count: stats.neutral,
    },
    {
      type: "sad" as const,
      icon: BsFillEmojiFrownFill,
      color: "#ff441f",
      count: stats.sad,
    },
  ];

  return (
    <div className={styles.emojiFeedbackStats}>
      <div className={styles.statsContainer}>
        {emojiData.map((emoji) => {
          const IconComponent = emoji.icon;
          return (
            <div
              key={emoji.type}
              className={styles.emojiStatItem}
              style={{ color: emoji.color }}
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
