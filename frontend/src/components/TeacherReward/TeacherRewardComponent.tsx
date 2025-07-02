import React, { useState } from "react";
import styles from "./TeacherRewardComponent.module.css";

interface RewardForm {
  content: string;
  points: string;
  rank: "normal" | "bronze" | "silver" | "gold";
}

const TeacherRewardComponent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState<RewardForm>({
    content: "",
    points: "",
    rank: "normal",
  });

  const handleClick = () => {
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
    setFormData({
      content: "",
      points: "",
      rank: "normal",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // ここで報酬データを処理
    handleClose();
  };

  return (
    <>
      <div className={styles.addButton} onClick={handleClick}>
        <span className={styles.plusIcon}>+</span>
      </div>

      {showPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h2 className={styles.popupTitle}>報酬の追加</h2>
            <button className={styles.closeButton} onClick={handleClose}>
              閉じる
            </button>

            <div className={styles.formGroup}>
              <label htmlFor="content">報酬の内容:</label>
              <input
                type="text"
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="報酬の内容を入力してください"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="points">必要ポイント:</label>
              <input
                type="number"
                id="points"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                placeholder="必要なポイントを入力してください"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rank">必要ランク:</label>
              <select
                id="rank"
                name="rank"
                value={formData.rank}
                onChange={handleInputChange}
              >
                <option value="normal">normal</option>
                <option value="bronze">bronze</option>
                <option value="silver">silver</option>
                <option value="gold">gold</option>
              </select>
            </div>

            <button className={styles.submitButton} onClick={handleSubmit}>
              追加
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherRewardComponent;
