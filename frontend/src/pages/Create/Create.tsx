// react
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../../context/PostContext";
import { useDebateTheme } from "../../context/DebateThemeContext";

// components
import Sidebar from "../../components/Sidebar/Sidebar";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import Loading from "../../components/Loading/Loading";

// utils
import { getCurrentUser, type User } from "../../utils/auth";

// css
import styles from "./Create.module.css";

interface ColorSetResponse {
  camp_type: number;
  colors: string[];
}

interface ThemeColorResponse {
  group_number: number;
  colorsets: ColorSetResponse[];
}

const Create = () => {
  const [colors, setColors] = useState<string[]>([]);
  const [post, setPost] = useState("");
  const [selectColor, setSelectColor] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const navigate = useNavigate();
  const { addPost } = usePost();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { theme, fetchTheme } = useDebateTheme();
  const [isPosting, setIsPosting] = useState(false); // ←追加

  useEffect(() => {
    // テーマに関する情報を取得する
    fetchTheme();

    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, [fetchTheme]);

  // theme が取得されたときに色を設定
  useEffect(() => {
    // 期間中で陣営未選択ならCampSelectへ（DBの最新状態で確認）
    (async () => {
      if (theme && currentUser && currentUser.user_type === "student") {
        const now = new Date();
        const start = new Date(theme.start_date);
        const end = new Date(theme.end_date);
        if (now >= start && now <= end) {
          try {
            const res = await fetch(
              `http://localhost:5000/api/students/${currentUser.id}`
            );
            if (res.ok) {
              const s = await res.json();
              if (s) {
                if (s.camp_id === null || s.camp_id === undefined) {
                  navigate("/campselect");
                  return;
                } else if (s.camp_id !== currentUser.camp_id) {
                  // 同期（ローカル更新）
                  const updated = {
                    ...currentUser,
                    camp_id: s.camp_id,
                  } as User;
                  localStorage.setItem("user", JSON.stringify(updated));
                  setCurrentUser(updated);
                }
              }
            }
          } catch (e) {
            console.error("Failed to verify camp selection:", e);
          }
        }
      }
    })();

    const fetchColorSets = async () => {
      try {
        if (theme?.theme_id && currentUser?.camp_id) {
          const response = await fetch(
            `http://localhost:5000/api/colorsets/theme/${theme.theme_id}`
          );
          if (response.ok) {
            const data: ThemeColorResponse = await response.json();

            // ユーザーの陣営に対応する色グループを選択
            if (data.colorsets && data.colorsets.length > 0) {
              // ユーザーのcamp_idに対応するcolorsetを探す
              const userCampColorset = data.colorsets.find(
                (colorset) => colorset.camp_type === currentUser.camp_id
              );

              if (userCampColorset) {
                setColors(userCampColorset.colors);
              } else {
                // 対応するcolorsetが見つからない場合、最初のcolorsetを使用
                console.warn(
                  "ユーザーの陣営に対応するcolorsetが見つかりません。最初のcolorsetを使用します。"
                );
                setColors(data.colorsets[0].colors);
              }
            } else {
              // フォールバック用のデフォルトカラー
              setColors([
                "#8097f9",
                "#6273f2",
                "#343be4",
                "#373acb",
                "#2f33a4",
              ]);
            }
          } else {
            console.error("カラーセットのフェッチに失敗");
            // デフォルトのカラーにフォールバック
            setColors(["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]);
          }
        } else {
          if (!theme?.theme_id) {
            console.warn(
              "テーマが取得できませんでした。デフォルトカラーを使用します。"
            );
          }
          if (!currentUser?.camp_id) {
            console.warn(
              "ユーザーの陣営情報が取得できませんでした。デフォルトカラーを使用します。"
            );
          }
          // テーマまたは陣営情報がない場合もデフォルトカラーを設定
          setColors(["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]);
        }
      } catch (error) {
        console.error("カラーセットの取得エラー:", error);
        // デフォルトのカラーにフォールバック
        setColors(["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]);
      } finally {
        // どんな場合でもloading状態を解除
        setShowLoading(false);
      }
    };

    // themeとcurrentUserの取得を待つため少し遅延させる
    const timer = setTimeout(fetchColorSets, 200);
    return () => clearTimeout(timer);
  }, [theme, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (post.trim() === "" || colors.length === 0) return;

    setIsPosting(true);

    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error("ログインしているユーザーがいない");
      navigate("/login");
      setIsPosting(false);
      return;
    }
    if (!theme?.theme_id) {
      alert("テーマ情報が取得できません");
      setIsPosting(false);
      return;
    }

    // 新しい付箋のためのランダムな初期位置を生成（重複を避けるため）
    const randomX = Math.floor(Math.random() * 300) + 50; // 50-350px
    const randomY = Math.floor(Math.random() * 200) + 50; // 50-250px

    await addPost({
      text: post,
      color: colors[selectColor],
      student_id: currentUser.id,
      x_axis: randomX,
      y_axis: randomY,
      theme_id: theme.theme_id,
    });

    setPost("");
    setSelectColor(0);
    navigate("/dashboard");
  };

  if (showLoading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {currentUser?.user_type === "teacher" ? <TeacherSidebar /> : <Sidebar />}
      <form className={styles.createForm} onSubmit={handleSubmit}>
        <h2>Add new post</h2>
        <textarea
          className={styles.formTextarea}
          value={post}
          onChange={(e) => setPost(e.target.value)}
        />
        <div className={styles.colorPicker}>
          <span className={styles.label}>Color</span>
          <div className={styles.colorList}>
            {colors.length > 0 &&
              colors.map((color, idx) => (
                <div
                  key={color}
                  className={`${styles.colorCircle}${
                    selectColor === idx ? " " + styles.selected : ""
                  }`}
                  style={{
                    backgroundColor: color,
                  }}
                  onClick={() => setSelectColor(idx)}
                >
                  {selectColor === idx && (
                    <span className={styles.check}>&#10003;</span>
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate("/dashboard")}
            disabled={isPosting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.postBtn}
            disabled={isPosting}
            style={{
              opacity: isPosting ? 0.5 : 1,
              cursor: isPosting ? "not-allowed" : "pointer",
            }}
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Create;
