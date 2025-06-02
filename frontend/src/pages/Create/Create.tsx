// react
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../../context/PostContext";

// components
import Sidebar from "../../components/Sidebar/Sidebar";

// css
import styles from "./Create.module.css";

const Create = () => {
  const colors = ["#ffdf88", "#e0f7f4", "#ffc3c3", "#e8dff5", "#cdf7ff"];
  const [post, setPost] = useState("");
  const [selectColor, setSelectColor] = useState(0);
  const navigate = useNavigate();
  const { addPost } = usePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (post.trim() === "") return;

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
            {colors.map((color, idx) => (
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
