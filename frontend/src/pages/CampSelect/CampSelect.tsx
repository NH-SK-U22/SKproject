// react
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// utils
import { getCurrentUser } from "../../utils/auth";

// css
import styles from "./CampSelect.module.css";

const CampSelect = () => {
  const navigate = useNavigate();
  const [selectedCamp, setSelectedCamp] = useState("camp1");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (camp: string) => {
    setSelectedCamp(camp);
  };

  const handleNext = async () => {
    setIsLoading(true);

    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("ログイン情報が見つかりません");
      navigate("/login");
      return;
    }

    try {
      // 陣営選択をcamp_idに変換 (camp1 = 1, camp2 = 2)
      const campId = selectedCamp === "camp1" ? 1 : 2;

      // ユーザーのcamp_idをデータベースに保存
      const response = await fetch(
        `http://localhost:5000/api/students/${currentUser.id}/camp`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            camp_id: campId,
          }),
        }
      );

      if (response.ok) {
        // localStorageのユーザー情報を更新
        const updatedUser = { ...currentUser, camp_id: campId };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Createページに移動
        navigate("/create");
      } else {
        const errorData = await response.json();
        alert("陣営選択に失敗しました: " + (errorData.error || "不明なエラー"));
      }
    } catch (error) {
      console.error("陣営選択エラー:", error);
      alert("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select Camp</h1>
      <div className={styles.campSelect}>
        <button
          className={`${styles.campSelectBtn} ${
            selectedCamp === "camp1" ? styles.active : ""
          }`}
          onClick={() => handleSelect("camp1")}
        >
          <span>陣営1</span>
        </button>
        <button
          className={`${styles.campSelectBtn} ${
            selectedCamp === "camp2" ? styles.active : ""
          }`}
          onClick={() => handleSelect("camp2")}
        >
          <span>陣営2</span>
        </button>
      </div>
      <button
        className={styles.next}
        type="button"
        onClick={handleNext}
        disabled={isLoading}
      >
        {isLoading ? "選択中..." : "Next"}
      </button>
    </div>
  );
};

export default CampSelect;
