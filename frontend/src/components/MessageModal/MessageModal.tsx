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
import EmojiFeedbackWithStats from "../EmojiFeedback/EmojiFeedbackWithStats";

interface MessageModalProps {
  post: {
    id: number;
    text: string;
    color: string;
    student_id?: number;
    feedback_A?: number;
    feedback_B?: number;
    feedback_C?: number;
    author_camp_id?: number;
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
                      <div className={styles.emojiFeedbackWrapper}>
                        <EmojiFeedbackWithStats
                          stats={{
                            happy: post.feedback_A || 0,
                            neutral: post.feedback_B || 0,
                            sad: post.feedback_C || 0,
                          }}
                          stickyId={post.id}
                          stickyAuthorId={post.student_id || 0}
                          stickyAuthorCampId={post.author_camp_id || null}
                          onStatsUpdate={(newStats) => {
                            // フィードバック更新時の処理（オプション）
                            console.log(
                              "フィードバックが更新されました:",
                              newStats
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.chatArea}>
                    <ChatRoom stickyId={post.id} />
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
