import React, { useEffect, useState } from "react";
import styles from "./RewardComponent.module.css";
import { HiCurrencyYen } from "react-icons/hi2";

interface RewardProps {
  rewardInfo: string;
  point: number;
  rank: number;
  reward_id: number;
  isSold?: boolean;
  userHavePoint: number;
  onDelete?: (id: number) => void;
  onExchanged?: (newHavePoint: number) => void;
}

import { getCurrentUser, type User } from "../../utils/auth";

// 画像のインポート
import bronzeImg from "../../../public/images/3rd.png";
import silverImg from "../../../public/images/2nd.png";
import goldImg from "../../../public/images/1st.png";
import diamondImg from "../../../public/images/diamond.png";

const RewardComponent: React.FC<RewardProps> = ({ rewardInfo, point, rank, reward_id, isSold = false, userHavePoint, onDelete, onExchanged }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isExchanged, setIsExchanged] = useState(isSold);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  },[]);

  useEffect(() => {
    setIsExchanged(isSold);
  }, [isSold]);

  const handleClose = () => {
    setShowPopup(false);
  };

  // ランク値からランク名を返す関数
  const getRankName = (rank: number) => {
    switch (rank) {
      case 0: return "ブロンズ";
      case 1: return "シルバー";
      case 2: return "ゴールド";
      case 3: return "ダイヤモンド";
      default: return "ブロンズ";
    }
  };

  // 外側のボタンはポップアップ表示のみ
  const handleRedeem = () => {
    if (isExchanged) {
      alert("この報酬はすでに交換済みです");
      return;
    }
    if (point > userHavePoint) {
      alert("この報酬を交換するためのポイントが足りません");
      return;
    }
    // ユーザーのランクをsum_pointから算出
    let userRank = 0;
    if (currentUser) {
      const sum = currentUser.sum_point;
      if (sum >= 2000) userRank = 3; // ダイヤモンド
      else if (sum >= 1000) userRank = 2; // ゴールド
      else if (sum >= 500) userRank = 1; // シルバー
      else userRank = 0; // ブロンズ
      if (userRank < rank) {
        alert(`この報酬を交換するには${getRankName(rank)}ランクに到達する必要があります`);
        return;
      }
    }
    setShowPopup(true);
  };

  // ポップアップ内の交換実行
  const handleExchange = async () => {
    if (currentUser?.user_type === "student") {
      if (userHavePoint < point) {
        alert("ポイントが足りません");
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/holdRewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: currentUser.id, reward_id }),
        });
        if (res.ok) {
          setIsExchanged(true);
          setShowPopup(false);
          // ポイント減算
          const newHavePoint = userHavePoint - point;
          if (onExchanged) onExchanged(newHavePoint);
          // localStorageのuserも更新
          const user = { ...currentUser, have_point: newHavePoint };
          setCurrentUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          alert("交換が完了しました");
        } else {
          const data = await res.json();
          alert(data.error || "交換に失敗しました");
        }
      } catch {
        alert("通信エラーが発生しました");
      }
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rewards/${reward_id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setShowPopup(false);
        onDelete?.(reward_id);
      } else {
        const data = await response.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  // ランクに応じた画像を選択
  const getRankImage = () => {
    switch (rank) {
      case 0:
        return bronzeImg;
      case 1:
        return silverImg;
      case 2:
        return goldImg;
      case 3:
        return diamondImg;
      default:
        return bronzeImg;
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.imageSection} style={{ position: "relative" }}>
          <img src={getRankImage()} alt={rank + "ランク画像"} className={styles.rankImage} />
          {isExchanged && (
            <div className={styles.soldOverlay}>
              <span className={styles.soldLabel}>sold</span>
            </div>
          )}
        </div>
        <div className={styles.contentSection}>
          <p className={styles.rewardTitle}>{rewardInfo}</p>
          <p className={styles.pointAmount}>
            <HiCurrencyYen className={styles.pointIcon} />
            {point}p
          </p>
        </div>
        {currentUser?.user_type === "teacher"
          ? <button className={styles.redeemButton} onClick={handleRedeem}>削除</button>
          : <button className={styles.redeemButton} onClick={handleRedeem}>交換</button>}
      </div>
      {/* ポップアップはteacherまたは未交換時のみ */}
      {showPopup && !isExchanged && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <button className={styles.closeButton} onClick={handleClose}>
              ×
            </button>
            <div className={styles.popupContent}>
              {currentUser?.user_type === "teacher"
                ? <p className={styles.popupText}>この報酬を削除しますか？</p>
                : <p className={styles.popupText}>この報酬と交換しますか？</p>}
              {currentUser?.user_type === "teacher" ? null : <p className={styles.popupText}><HiCurrencyYen className={styles.currencyIcon} />{point}p</p>}
            </div>
            <div className={styles.buttonContainer}>
              {currentUser?.user_type === "teacher"
                ? <button className={styles.button} onClick={handleDelete}>削除</button>
                : <button className={styles.button} onClick={handleExchange}>交換</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RewardComponent;
