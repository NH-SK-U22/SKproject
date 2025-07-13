import React, { useState } from "react";
import styles from "./TeacherRewardComponent.module.css";

interface RewardForm {
  content: string;
  points: string;
  rank: "ブロンズ" | "シルバー" | "ゴールド" | "ダイヤモンド";
}

const TeacherRewardComponent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState<RewardForm>({
    content: "",
    points: "",
    rank: "ブロンズ",
  });

  const [isSubmitting,setIsSubmitting] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
    setFormData({
      content: "",
      points: "",
      rank: "ブロンズ",
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

  const rankToNumber = (rank:string): number => {
    switch (rank) {
      case "ブロンズ":return 0;
      case "シルバー":return 1;
      case "ゴールド":return 2;
      case "ダイヤモンド":return 3;
      default: return 0;
    }
  };

  const handleSubmit = async () => {
    
    // バリデーション
    if (!formData.content.trim()) {
      console.log("❌ バリデーションエラー: 報酬の内容が空");
      alert("報酬の内容を入力してください");
      return;
    }
    if (!formData.points || parseInt(formData.points) <= 0) {
      console.log("❌ バリデーションエラー: ポイントが無効");
      alert("有効なポイント数を入力してください");
      return;
    }
  
    console.log("✅ バリデーション完了");
    console.log("📋 送信データ:", formData);
  
    setIsSubmitting(true);
  
    // try {
    //   const requestData = {
    //     reward_content: formData.content,
    //     need_point: parseInt(formData.points),
    //     need_rank: rankToNumber(formData.rank),
    //     creater: 1,
    //   };
    // }
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rank">必要ランク:</label>
              <select
                id="rank"
                name="rank"
                value={formData.rank}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="ブロンズ">ブロンズ</option>
                <option value="シルバー">シルバー</option>
                <option value="ゴールド">ゴールド</option>
                <option value="ダイヤモンド">ダイヤモンド</option>
              </select>
            </div>

            <button className={styles.submitButton} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "追加中..." : "追加"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherRewardComponent;
