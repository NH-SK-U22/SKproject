// react
import React from "react";

// css
import styles from "./StickyNote.module.css";

// types
interface StickyNoteProps {
  post: {
    text: string;
    color: string;
  };
  size?: "small" | "medium" | "large";
  className?: string;
  style?: React.CSSProperties;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  post,
  size = "medium",
  className = "",
  style = {},
}) => {
  const sizeStyles = {
    small: {
      height: "200px",
      fontSize: "1rem",
      padding: "15px",
      cornerSize: "30px",
    },
    medium: {
      height: "300px",
      fontSize: "1.1rem",
      padding: "18px",
      cornerSize: "35px",
    },
    large: {
      height: "400px",
      fontSize: "1.25rem",
      padding: "20px",
      cornerSize: "40px",
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <div
      className={`${styles.stickyNote} ${className}`}
      style={{
        backgroundColor: post.color,
        height: currentSize.height,
        padding: currentSize.padding,
        ...style,
      }}
    >
      <div
        className={styles.noteContent}
        style={{
          fontSize: currentSize.fontSize,
          height: `calc(100% - ${currentSize.cornerSize}px)`,
        }}
      >
        {post.text}
      </div>
      <div
        className={styles.cornerFold}
        style={{
          width: currentSize.cornerSize,
          height: currentSize.cornerSize,
        }}
      />
    </div>
  );
};

export default StickyNote;
