// react
import React, { useState } from "react";
import { createPortal } from "react-dom";

// react-icons
import { IoChatbubbleEllipsesOutline, IoClose } from "react-icons/io5";

// css
import styles from "./MessageModal.module.css";

// components
import ChatRoom from "../ChatRoom/ChatRoom";
import StickyNote from "../StickyNote/StickyNote";

interface MessageModalProps {
  post: {
    id: number;
    text: string;
    color: string;
  };
}

const MessageModal = ({ post }: MessageModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={styles.messageTriggerBtn}
      >
        <IoChatbubbleEllipsesOutline className={styles.messageIcon} />
      </button>

      {isOpen &&
        createPortal(
          <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalWrapper}>
              <div className={styles.modalContainer}>
                <div className={styles.modalContent}>
                  <div className={styles.mainArea}>
                    <div className={styles.stickyNoteArea}>
                      <StickyNote post={post} size="large" />
                    </div>
                  </div>
                  <div className={styles.chatArea}>
                    <ChatRoom />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                <IoClose className={styles.closeIcon} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default MessageModal;
