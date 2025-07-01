// react
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePost } from "../../context/PostContext";

// components
import Sidebar from "../../components/Sidebar/Sidebar";
import Loading from "../../components/Loading/Loading";

// css
import styles from "./Create.module.css";

interface ColorSetResponse {
  group_number: number;
  colors: string[];
}

const Create = () => {
  const [searchParams] = useSearchParams();
  const camp = searchParams.get("camp") || "camp1";

  const [colors, setColors] = useState<string[]>([]);
  const [post, setPost] = useState("");
  const [selectColor, setSelectColor] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const navigate = useNavigate();
  const { addPost } = usePost();

  useEffect(() => {
    // loading画面の表示を遅らせるタイマー
    const loadingTimer = setTimeout(() => {
      setShowLoading(true);
    }, 500); // loading画面は500ms後に表示

    const fetchColorSets = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/colorsets/${camp}`
        );
        if (response.ok) {
          const data: ColorSetResponse[] = await response.json();
          const colorSetsArray = data.map((item) => item.colors);

          // 陣営のcolorsetからランダムに選ぶ
          if (colorSetsArray.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * colorSetsArray.length
            );
            setColors(colorSetsArray[randomIndex]);
          }
        } else {
          console.error("Failed to fetch colorsets");
          // デフォルトのカラーにフォールバック
          setColors(["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]);
        }
      } catch (error) {
        console.error("Error fetching colorsets:", error);
        // デフォルトのカラーにフォールバック
        setColors(["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]);
      } finally {
        setShowLoading(false);
        clearTimeout(loadingTimer);
      }
    };

    fetchColorSets();

    return () => {
      clearTimeout(loadingTimer);
    };
  }, [camp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (post.trim() === "" || colors.length === 0) return;

    addPost({
      text: post,
      color: colors[selectColor],
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
      <Sidebar />
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
