import React, { useState } from "react";
import styles from "./Create.module.css";

export default function AddPostForm() {
  const colors = ["#ffdf88", "#e0f7f4", "#ffc3c3", "#e8dff5", "#cdf7ff"];

  const [post, setPost] = useState("");
  const [selectColor, setSelectColor] = useState(0);

  return (
    <div className={styles.container}>
      <form className={styles.createForm}>
        <h2>Add new post</h2>

        {/* post */}
        <label className={styles.formLabel}>Post</label>
        <textarea
          className={styles.formTextarea}
          value={post}
          onChange={(e) => setPost(e.target.value)}
        />

        {/* color picker */}
        <div className={styles.colorPicker}>
          <span className={styles.label}>Color</span>
          <div className={styles.colorList}>
            {colors.map((color, idx) => (
              <div
                key={color}
                className={`${styles.colorCircle}${
                  selectColor === idx ? " selected" : ""
                }`}
                style={{ backgroundColor: color }}
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
          <button type="button" className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.postBtn}>
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
