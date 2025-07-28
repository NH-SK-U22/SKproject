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
    const fetchColorSets = async () => {
      try {
        if (theme?.theme_id) {
          const response = await fetch(
            `http://localhost:5000/api/colorsets/theme/${theme.theme_id}`
          );
          if (response.ok) {
            const data: ThemeColorResponse = await response.json();

            // このテーマのすべての陣営の色グループからランダムに選択されます
            if (data.colorsets && data.colorsets.length > 0) {
              const randomIndex = Math.floor(
                Math.random() * data.colorsets.length
              );
              setColors(data.colorsets[randomIndex].colors);
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
          console.warn(
            "テーマが取得できませんでした。デフォルトカラーを使用します。"
          );
          // テーマがない場合もデフォルトカラーを設定
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

    // themeの取得を待つため少し遅延させる
    const timer = setTimeout(fetchColorSets, 200);
    return () => clearTimeout(timer);
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (post.trim() === "" || colors.length === 0) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error("ログインしているユーザーがいない");
      navigate("/login");
      return;
    }
    if (!theme?.theme_id) {
      alert("テーマ情報が取得できません");
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
          >
            Cancel
          </button>
          <button type="submit" className={styles.postBtn}>
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default Create;
