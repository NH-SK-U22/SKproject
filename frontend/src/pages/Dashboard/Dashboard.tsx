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
import { getCurrentUser, type User, clearUserCamp } from "../../utils/auth";

const DRAG_MARGIN = 0;
const GRID_GAP = 30;
const NOTE_WIDTH = 200;

const StickyNote = ({
  post,
  gridRef,
  maxPerRow,
  isLastMoved,
  onMoveEnd,
  isSidebarHovered,
  currentUserId,
  localPosition,
  fixedPosition,
}: {
  post: {
    id: number;
    text: string;
    color: string;
    x_axis?: number;
    y_axis?: number;
    gemini?: string;
    student_id?: number;
    display_index?: number;
  };
  gridRef: React.RefObject<HTMLDivElement | null>;
  maxPerRow: number;
  isLastMoved: boolean;
  onMoveEnd: (id: number, x: number, y: number) => void;
  isSidebarHovered: boolean;
  currentUserId: number;
  localPosition?: { x: number; y: number };
  fixedPosition?: { x: number; y: number };
}) => {
  // ドラッグ状態
  const [dragging, setDragging] = useState(false);

  // 位置が優先順位を決める：localPosition > fixedPosition > database position > display_index based position
  const getInitialPosition = useCallback(() => {
    if (localPosition) {
      return localPosition;
    }
    if (fixedPosition) {
      return fixedPosition;
    }
    if (post.x_axis !== undefined && post.y_axis !== undefined) {
      // (0, 0)位置も有効な位置として扱う
      return { x: post.x_axis, y: post.y_axis };
    }
    // DB/ローカルに座標が無い場合は、display_index を使用（配列順序に依存しない）
    const displayIdx = post.display_index || 0;
    const x = (displayIdx % maxPerRow) * (NOTE_WIDTH + GRID_GAP);
    const y = Math.floor(displayIdx / maxPerRow) * (NOTE_WIDTH + GRID_GAP);
    return { x, y };
  }, [
    localPosition,
    fixedPosition,
    post.x_axis,
    post.y_axis,
    post.display_index,
    maxPerRow,
  ]);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    getInitialPosition()
  );

  // 位置初期化: 一度だけ実行
  const initializedRef = useRef(false);
  useEffect(() => {
    if (position === null && !initializedRef.current) {
      setPosition(getInitialPosition());
      initializedRef.current = true;
    }
  }, [position, getInitialPosition]);

  // ローカル位置の更新のみ監視（Socket/DB更新は無視）
  useEffect(() => {
    if (localPosition && !dragging) {
      setPosition(localPosition);
    }
  }, [localPosition, dragging]);
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
            // 4面すべてDRAG_MARGINを使用（左上ははみ出さない）
            const maxX = grid.clientWidth - noteWidth - DRAG_MARGIN;
            x = Math.max(DRAG_MARGIN, Math.min(x, maxX));

            // 下方向も制限（画面の高さを超えないように）
            const maxY = grid.clientHeight - noteHeight - DRAG_MARGIN;
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

  const getTransform = () => {
    return `translate3d(${position?.x ?? 0}px, ${position?.y ?? 0}px, 0)`;
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
  // サーバーACK待ちの座標（Socket/GETで反映されたら解除）
  const [pendingAckPositions, setPendingAckPositions] = useState<{
    [key: number]: { x: number; y: number };
  }>({});
  // 各便利貼の固定位置（一度決定したら変更しない）
  const [fixedPositions, setFixedPositions] = useState<{
    [key: number]: { x: number; y: number };
  }>({});

  // 便利貼が初めて表示される時のみ固定位置を記録（既存の位置は保持）
  const initializedPostsRef = useRef<Set<number>>(new Set());
  const lastDisplayIndexRef = useRef<number>(0); // 最後に使用した display_index を記録
  useEffect(() => {
    posts.forEach((post) => {
      // この付箋の位置が初期化済みかチェック
      if (!initializedPostsRef.current.has(post.id)) {
        initializedPostsRef.current.add(post.id);

        // 既に固定位置があれば保持
        if (fixedPositions[post.id]) return;

        // 新規付箋の初期位置を設定
        if (post.x_axis !== undefined && post.y_axis !== undefined) {
          // DB に座標がある場合はそれを使用
          setFixedPositions((prev) => ({
            ...prev,
            [post.id]: { x: post.x_axis!, y: post.y_axis! },
          }));
        } else {
          // DB に座標がない場合は最後の display_index の次の位置に配置
          const displayIdx = Math.max(
            lastDisplayIndexRef.current + 1,
            post.display_index || 0
          );
          lastDisplayIndexRef.current = displayIdx;
          const x = (displayIdx % maxPerRow) * (NOTE_WIDTH + GRID_GAP);
          const y =
            Math.floor(displayIdx / maxPerRow) * (NOTE_WIDTH + GRID_GAP);
          setFixedPositions((prev) => ({
            ...prev,
            [post.id]: { x, y },
          }));
        }
      }
    });
  }, [posts, maxPerRow]);
  const { theme, fetchTheme } = useDebateTheme();
  const navigate = useNavigate();
  const initializedRef = useRef<boolean>(false);

  const handleNoteMove = useCallback(
    async (id: number, x: number, y: number) => {
      setLastMovedNoteId(id);

      // 固定位置を先に更新（今後の初期位置として使用）
      setFixedPositions((prev) => ({
        ...prev,
        [id]: { x, y },
      }));

      // 即時ローカル位置更新（ドラッグ中の表示用）
      setLocalPositions((prev) => ({
        ...prev,
        [id]: { x, y },
      }));

      try {
        // 即時にサーバーに保存
        await updatePost(id, { x_axis: x, y_axis: y });

        // 保存成功後、ローカル位置をクリア（固定位置を使用）
        setLocalPositions((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (error) {
        console.error("Failed to save position:", error);
        // エラー時は固定位置を元に戻す
        setFixedPositions((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [updatePost]
  );

  // サーバーから反映されたら(= posts の該当付箋の座標が一致)ローカルオーバーライドを解除
  useEffect(() => {
    if (!posts || Object.keys(pendingAckPositions).length === 0) return;
    const ids = Object.keys(pendingAckPositions).map((k) => Number(k));
    const toClear: number[] = [];
    ids.forEach((noteId) => {
      const post = posts.find((p) => p.id === noteId);
      const target = pendingAckPositions[noteId];
      if (
        post &&
        post.x_axis !== undefined &&
        post.y_axis !== undefined &&
        target &&
        post.x_axis === target.x &&
        post.y_axis === target.y
      ) {
        toClear.push(noteId);
      }
    });
    if (toClear.length > 0) {
      setLocalPositions((prev) => {
        const next = { ...prev } as { [key: number]: { x: number; y: number } };
        toClear.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setPendingAckPositions((prev) => {
        const next = { ...prev } as { [key: number]: { x: number; y: number } };
        toClear.forEach((id) => delete next[id]);
        return next;
      });
    }
  }, [posts, pendingAckPositions]);

  // コンポーネント装着時に主題取得とSocket接続を開始（初回のみ）
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);

      // テーマ情報を取得（初回）
      fetchTheme();

      // Socket接続を開始（初回）（サーバーからのデータを受信するため）
      connectSocket(user.school_id);
    }

    // アンマウント時にSocket接続を切断
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket, fetchTheme]);

  // テーマが読み込まれたら付箋をロード
  useEffect(() => {
    const user = getCurrentUser();
    if (user && theme?.theme_id) {
      console.log(
        "Dashboard: Loading posts for school:",
        user.school_id,
        "theme:",
        theme.theme_id
      );
      loadSchoolPosts(user.school_id, theme.theme_id);
    } else {
      console.log(
        "Dashboard: Not loading posts - user:",
        !!user,
        "theme_id:",
        theme?.theme_id
      );
    }
  }, [theme, loadSchoolPosts]);

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
    // 学生の場合、必ずcamp_idの状態を確認する（現行テーマで未選択ならCampSelectへ）
    (async () => {
      const current = getCurrentUser();
      if (current && current.user_type === "student") {
        try {
          // 常にデータベースで最新のcamp_id状態を確認
          const res = await fetch(
            `http://localhost:5000/api/students/${current.id}`
          );
          if (res.ok) {
            const s = await res.json();
            // 現行テーマに対して選択済みかをlocalStorageで確認
            const key = `selected_camp_theme_id_${current.id}`;
            const selectedForTheme = localStorage.getItem(key);
            const selectedThemeId = selectedForTheme
              ? Number(selectedForTheme)
              : null;

            if (
              !s ||
              s.camp_id === null ||
              s.camp_id === undefined ||
              !theme?.theme_id ||
              selectedThemeId !== theme.theme_id
            ) {
              // DB未選択、または現行テーマ未選択の場合はCampSelectへ
              navigate("/campselect");
              return;
            } else if (s && s.camp_id) {
              // データベースにcamp_idがある場合は、ローカルストレージを更新
              const updated = { ...current, camp_id: s.camp_id } as User;
              localStorage.setItem("user", JSON.stringify(updated));
              setCurrentUser(updated);
            }
          }
        } catch (e) {
          console.error("Failed to verify camp selection on dashboard:", e);
        }
      }
    })();
    const now = new Date();
    const end = new Date(theme.end_date);
    if (now > end) {
      // 討論終了時にユーザーの陣営選択を削除
      clearUserCamp();
      navigate("/result");
    } else {
      // 残り時間で自動遷移
      const timeout = setTimeout(() => {
        // 討論終了時にユーザーの陣営選択を削除
        clearUserCamp();
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
                gridRef={gridRef}
                maxPerRow={maxPerRow}
                isLastMoved={post.id === lastMovedNoteId}
                onMoveEnd={handleNoteMove}
                isSidebarHovered={isSidebarHovered}
                currentUserId={currentUser?.id || 0}
                localPosition={localPositions[post.id]}
                fixedPosition={fixedPositions[post.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
