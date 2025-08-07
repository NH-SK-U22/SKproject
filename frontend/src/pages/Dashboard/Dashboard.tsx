// react
import React, { useRef, useState, useEffect, useCallback } from "react";

// components
import Sidebar from "../../components/Sidebar/Sidebar";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import MessageModal from "../../components/MessageModal/MessageModal";

// css
import styles from "./Dashboard.module.css";

// context
import { usePost } from "../../context/PostContext";
import { useDebateTheme } from "../../context/DebateThemeContext";
import { useNavigate } from "react-router-dom";

// utils
import { getCurrentUser, type User } from "../../utils/auth";

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
  isSidebarHovered,
  currentUserId,
  localPosition,
}: {
  post: {
    id: number;
    text: string;
    color: string;
    x_axis?: number;
    y_axis?: number;
    gemini?: string;
    student_id?: number;
  };
  idx: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  maxPerRow: number;
  isLastMoved: boolean;
  onMoveEnd: (id: number, x: number, y: number) => void;
  isSidebarHovered: boolean;
  currentUserId: number;
  localPosition?: { x: number; y: number };
}) => {
  // ドラッグ状態
  const [dragging, setDragging] = useState(false);

  // 位置が優先順位を決める：localPosition > database position > null
  const getInitialPosition = () => {
    if (localPosition) {
      return localPosition;
    }
    if (post.x_axis !== undefined && post.y_axis !== undefined) {
      // (0, 0)位置も有効な位置として扱う
      return { x: post.x_axis, y: post.y_axis };
    }
    return null;
  };

  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    getInitialPosition()
  );

  // localPositionの変更をリッスンし、すぐに更新する
  useEffect(() => {
    if (localPosition && !dragging) {
      setPosition(localPosition);
    }
  }, [localPosition, dragging]);

  // 他のユーザーからの位置更新を受信した時にローカル位置を同期
  useEffect(() => {
    // ローカルロケーションのオーバーライドがなく、ドラッグ＆ドロップの状態でない場合のみ同期させる
    if (
      !localPosition &&
      !dragging &&
      post.x_axis !== undefined &&
      post.y_axis !== undefined &&
      (position === null ||
        position.x !== post.x_axis ||
        position.y !== post.y_axis)
    ) {
      setPosition({ x: post.x_axis, y: post.y_axis });
    }
  }, [post.x_axis, post.y_axis, dragging, position, localPosition]);
  const offset = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  // ellipsis上でのドラッグのみを許可
  const handleMouseDown = (e: React.MouseEvent) => {
    // 自分の付箋のみ移動可能
    if (post.student_id !== currentUserId) {
      return;
    }

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
    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        // requestAnimationFrameを使用して60FPSを確保
        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        animationId = requestAnimationFrame(() => {
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
        });
      }
    };
    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        // 新しい位置がある場合、データベースに保存
        if (position) {
          onMoveEnd(post.id, position.x, position.y);
        }
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
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [dragging, gridRef, post.id, onMoveEnd, position]);

  // 初期位置：idxに基づく
  const getTransform = () => {
    if (position === null) {
      const x = (idx % maxPerRow) * (NOTE_WIDTH + GRID_GAP);
      const y = Math.floor(idx / maxPerRow) * (NOTE_WIDTH + GRID_GAP);
      return `translate3d(${x}px, ${y}px, 0)`;
    }
    return `translate3d(${position.x}px, ${position.y}px, 0)`;
  };

  // z-index の計算 - sidebarがhoverされている場合は低く設定
  const getZIndex = () => {
    if (dragging) {
      return undefined; // CSSでz-indexを制御
    }
    if (isLastMoved) return 10;
    return 1;
  };

  // CSSクラス名の計算
  const getClassName = () => {
    let className = styles.stickyNote;
    if (dragging) {
      className += ` ${styles.dragging}`;
      if (isSidebarHovered) {
        className += ` ${styles.belowSidebar}`;
      }
    }
    return className;
  };

  return (
    <div
      ref={noteRef}
      className={getClassName()}
      style={{
        backgroundColor: post.color,
        position: "absolute",
        transform: getTransform(),
        zIndex: getZIndex(),
        cursor: dragging ? "grabbing" : "default",
        transition: dragging ? "none" : "transform 0.2s ease-out",
      }}
    >
      <div
        className={styles.ellipsis}
        onMouseDown={handleMouseDown}
        style={{
          cursor: post.student_id === currentUserId ? "grab" : "default",
        }}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={styles.noteText}>{post.gemini}</div>
      <div className={styles.cornerFold}></div>
      <MessageModal post={post} />
    </div>
  );
};

const Dashboard = () => {
  const {
    posts,
    loadSchoolPosts,
    updatePost,
    connectSocket,
    disconnectSocket,
  } = usePost();
  const gridRef = useRef<HTMLDivElement>(null);
  const [maxPerRow, setMaxPerRow] = useState(1);
  const [lastMovedNoteId, setLastMovedNoteId] = useState<number | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // ローカル・ロケーション・オーバーライド・ステータス（即時フィードバック用）
  const [localPositions, setLocalPositions] = useState<{
    [key: number]: { x: number; y: number };
  }>({});

  const moveTimeoutRef = useRef<number | null>(null);
  const { theme } = useDebateTheme();
  const navigate = useNavigate();

  const handleNoteMove = useCallback(
    (id: number, x: number, y: number) => {
      setLastMovedNoteId(id);

      // 即時ローカル位置更新
      setLocalPositions((prev) => ({
        ...prev,
        [id]: { x, y },
      }));

      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }

      // バックグラウンド・シンク・サーバー（最小遅延）
      moveTimeoutRef.current = setTimeout(() => {
        updatePost(id, { x_axis: x, y_axis: y });
        moveTimeoutRef.current = null;
        // 同期が完了したら、ローカル位置オーバーライドをクリア
        setTimeout(() => {
          setLocalPositions((prev) => {
            const newPositions = { ...prev };
            delete newPositions[id];
            return newPositions;
          });
        }, 200); // Socket同期の待ち時間を短縮
      }, 50); // 50ms遅延
    },
    [updatePost]
  );

  // コンポーネント装着時に同校の付箋を読み込み、Socket接続を開始
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // 同校の付箋を読み込む（theme_idが必須）
      if (theme?.theme_id) {
        loadSchoolPosts(user.school_id, theme.theme_id);
      }
      // Socket接続を開始
      connectSocket(user.school_id);
    }

    // コンポーネントのアンマウント時にSocket接続を切断
    return () => {
      disconnectSocket();
    };
  }, [loadSchoolPosts, connectSocket, disconnectSocket, theme]);

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

  // sidebarのhover状態を監視
  useEffect(() => {
    const checkSidebarHover = () => {
      const sidebarElements = document.querySelectorAll('[class*="sidebar"]');

      sidebarElements.forEach((element) => {
        if (
          element.className.includes("sidebar") &&
          !element.className.includes("Container")
        ) {
          const handleMouseEnter = () => {
            setIsSidebarHovered(true);
          };
          const handleMouseLeave = () => {
            setIsSidebarHovered(false);
          };

          element.addEventListener("mouseenter", handleMouseEnter);
          element.addEventListener("mouseleave", handleMouseLeave);

          return () => {
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
          };
        }
      });
    };

    // 遅延実行
    const timer = setTimeout(checkSidebarHover, 100);
    return () => clearTimeout(timer);
  }, []);

  // 期間終了時にResultへ遷移
  useEffect(() => {
    if (!theme) return;
    const now = new Date();
    const end = new Date(theme.end_date);
    if (now > end) {
      navigate("/result");
    } else {
      // 残り時間で自動遷移
      const timeout = setTimeout(() => {
        navigate("/result");
      }, end.getTime() - now.getTime());
      return () => clearTimeout(timeout);
    }
  }, [theme, navigate]);

  return (
    <div className={styles.dashboardContainer}>
      {currentUser?.user_type === "teacher" ? <TeacherSidebar /> : <Sidebar />}
      <main className={styles.mainContent}>
        {posts.length > 0 && (
          <div className={styles.notesGrid} ref={gridRef}>
            {posts.map((post) => (
              <StickyNote
                key={post.id}
                post={post}
                idx={post.display_index || 0}
                gridRef={gridRef}
                maxPerRow={maxPerRow}
                isLastMoved={post.id === lastMovedNoteId}
                onMoveEnd={handleNoteMove}
                isSidebarHovered={isSidebarHovered}
                currentUserId={currentUser?.id || 0}
                localPosition={localPositions[post.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
