// react
import React, { useRef, useState, useEffect } from "react";

// components
import Sidebar from "../../components/Sidebar/Sidebar";

// css
import styles from "./Dashboard.module.css";

// context
import { usePost } from "../../context/PostContext";

const DRAG_MARGIN = 0;
const GRID_GAP = 30;
const NOTE_WIDTH = 200;

const StickyNote = ({
  post,
  idx,
  gridRef,
  maxPerRow,
  isLastMoved,
  onMoveEnd,
}: {
  post: { id: number; text: string; color: string };
  idx: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  maxPerRow: number;
  isLastMoved: boolean;
  onMoveEnd: (id: number) => void;
}) => {
  // ドラッグ状態
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  // ellipsis上でのドラッグのみを許可
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    document.body.style.userSelect = "none";
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        // notesGridに基づく
        const grid = gridRef.current;
        if (grid) {
          const noteWidth = noteRef.current?.offsetWidth || 0;
          const noteHeight = noteRef.current?.offsetHeight || 0;
          let x =
            e.clientX - grid.getBoundingClientRect().left - offset.current.x;
          let y =
            e.clientY - grid.getBoundingClientRect().top - offset.current.y;
          // 4面すべてDRAG_MARGINを使用
          const maxX = grid.clientWidth - noteWidth - DRAG_MARGIN;
          const maxY = grid.clientHeight - noteHeight - DRAG_MARGIN;
          x = Math.max(DRAG_MARGIN, Math.min(x, maxX));
          y = Math.max(DRAG_MARGIN, Math.min(y, maxY));
          setPosition({ x, y });
        }
      }
    };
    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        onMoveEnd(post.id);
      }
      document.body.style.userSelect = "auto";
    };
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, gridRef, post.id, onMoveEnd]);

  // 初期位置：idxに基づく
  const defaultStyle: { left: number; top: number } =
    position === null
      ? {
          left: (idx % maxPerRow) * (NOTE_WIDTH + GRID_GAP),
          top: Math.floor(idx / maxPerRow) * (NOTE_WIDTH + GRID_GAP),
        }
      : { left: position.x, top: position.y };

  // z-index の計算
  const getZIndex = () => {
    if (dragging) return 100;
    if (isLastMoved) return 10;
    return 1;
  };

  return (
    <div
      ref={noteRef}
      className={
        dragging ? `${styles.stickyNote} ${styles.dragging}` : styles.stickyNote
      }
      style={{
        backgroundColor: post.color,
        left: defaultStyle.left,
        top: defaultStyle.top,
        zIndex: getZIndex(),
        cursor: dragging ? "grabbing" : "default",
      }}
    >
      <div className={styles.ellipsis} onMouseDown={handleMouseDown}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={styles.noteText}>{post.text}</div>
      <div className={styles.cornerFold}></div>
    </div>
  );
};

const Dashboard = () => {
  const { posts } = usePost();
  const gridRef = useRef<HTMLDivElement>(null);
  const [maxPerRow, setMaxPerRow] = useState(1);
  const [lastMovedNoteId, setLastMovedNoteId] = useState<number | null>(null);

  const handleNoteMove = (id: number) => {
    setLastMovedNoteId(id);
  };

  useEffect(() => {
    const handleResize = () => {
      const grid = gridRef.current;
      if (grid) {
        const availableWidth = grid.clientWidth;
        const perRow = Math.max(
          1,
          Math.floor((availableWidth + GRID_GAP) / (NOTE_WIDTH + GRID_GAP))
        );
        setMaxPerRow(perRow);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {posts.length > 0 && (
          <div className={styles.notesGrid} ref={gridRef}>
            {posts.map((post, idx) => (
              <StickyNote
                key={post.id}
                post={post}
                idx={idx}
                gridRef={gridRef}
                maxPerRow={maxPerRow}
                isLastMoved={post.id === lastMovedNoteId}
                onMoveEnd={handleNoteMove}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
