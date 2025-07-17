import React, { useEffect, useState } from "react";
import styles from "./RewardComponent.module.css";
import { HiCurrencyYen } from "react-icons/hi2";

interface RewardProps {
  rewardInfo: string;
  point: number;
  rank: number;
  reward_id: number;
  onDelete?: (id: number) => void;
}

import { getCurrentUser, type User } from "../../utils/auth";

// 画像のインポート
import bronzeImg from "../../../public/images/3rd.png";
import silverImg from "../../../public/images/2nd.png";
import goldImg from "../../../public/images/1st.png";
import diamondImg from "../../../public/images/diamond.png";

const RewardComponent: React.FC<RewardProps> = ({ rewardInfo, point, rank, reward_id, onDelete }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  },[]);

  const handleClick = () => {
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleRedeem = () => {
    handleClick();
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
        <div className={styles.imageSection}>
          <img src={getRankImage()} alt={rank + "ランク画像"} className={styles.rankImage} />
        </div>
        <div className={styles.contentSection}>
          <p className={styles.rewardTitle}>{rewardInfo}</p>
          <p className={styles.pointAmount}>
            <HiCurrencyYen className={styles.pointIcon} />
            {point}p
          </p>
        </div>
        {currentUser?.user_type === "teacher" ? <button className={styles.redeemButton} onClick={handleRedeem}>削除</button> : <button className={styles.redeemButton} onClick={handleRedeem}>交換</button>}
      </div>

      {showPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <button className={styles.closeButton} onClick={handleClose}>
              ×
            </button>
            <div className={styles.popupContent}>
            {currentUser?.user_type === "teacher" ? <p className={styles.popupText}>この報酬を削除しますか？</p> : <p className={styles.popupText}>この報酬と交換しますか？</p>}
              {currentUser?.user_type === "teacher" ? null : <p className={styles.popupText}><HiCurrencyYen className={styles.currencyIcon} />{point}p</p>}
            </div>
            <div className={styles.buttonContainer}>
              {currentUser?.user_type === "teacher" ? <button className={styles.button} onClick={handleDelete}>削除</button> : <button className={styles.button} onClick={handleClose}>交換</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RewardComponent;
