// react
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../../context/PostContext";

// components
import Sidebar from "../../components/Sidebar/Sidebar";

// css
import styles from "./Create.module.css";

const Create = () => {
  const colorSets = [
    ["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"],
    ["#faeada", "#f5d2b3", "#eeb483", "#e68c51", "#df6624"],
    ["#6c84ff", "#4959ff", "#2929ff", "#211ee4", "#1a1aaf"],
    ["#faeccb", "#f4d893", "#eec05b", "#eaa935", "#e38d24"],
    ["#8b7bff", "#6646ff", "#5321ff", "#450ff2", "#3a0ccd"],
    ["#effc8c", "#ecfa4a", "#eef619", "#e6e50c", "#d0bf08"],
    ["#c3b5fd", "#a58bfa", "#885df5", "#783bec", "#6325cd"],
    ["#fbfbea", "#f4f6d1", "#e8eda9", "#d7e076", "#bfcd41"],
    ["#c76bff", "#b333ff", "#a10cff", "#8d00f3", "#6e04b6"],
    ["#ffc472", "#fea039", "#fc8313", "#ed6809", "#cd510a"],
    ["#ead5ff", "#dab5fd", "#c485fb", "#ad57f5", "#9025e6"],
    ["#fdf9e9", "#fbf2c6", "#f8e290", "#f4ca50", "#efb121"],
    ["#fad3fb", "#f6b1f3", "#ef83e9", "#e253da", "#ba30b0"],
    ["#f8fbea", "#eef6d1", "#dceda9", "#c3df77", "#a0c937"],
    ["#f8d2e9", "#f4add7", "#ec7aba", "#e1539e", "#c12d74"],
    ["#dffcdc", "#c0f7bb", "#8fee87", "#56dd4b", "#2cb721"],
    ["#f6d4e5", "#efb2cf", "#e482ae", "#d85c91", "#c43a6e"],
    ["#cef9ef", "#9cf3e1", "#62e6cf", "#32cfb9", "#1bbfab"],
    ["#fcd4cc", "#f9b5a8", "#f48975", "#e9634a", "#d74b31"],
    ["#cef9f0", "#9df2e0", "#64e4cf", "#35ccb8", "#1ec0ad"],
  ];

  const [colors, setColors] = useState<string[]>([]);
  const [post, setPost] = useState("");
  const [selectColor, setSelectColor] = useState(0);
  const navigate = useNavigate();
  const { addPost } = usePost();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * colorSets.length);
    setColors(colorSets[randomIndex]);
  }, []);

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
