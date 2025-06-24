import React, { useState } from "react";
import styles from "./RewardComponent.module.css";
import { HiCurrencyYen } from "react-icons/hi2";

interface RewardProps {
  rewardInfo: string;
  point: number;
}

const RewardComponent: React.FC<RewardProps> = ({ rewardInfo, point }) => {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleRedeem = () => {
    handleClick();
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.imageSection}></div>
        <div className={styles.contentSection}>
          <p className={styles.rewardTitle}>{rewardInfo}</p>
          <p className={styles.pointAmount}>
            <HiCurrencyYen className={styles.pointIcon} />
            {point}p
          </p>
        </div>
        <button className={styles.redeemButton} onClick={handleRedeem}>
          交換
        </button>
      </div>

      {showPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <button className={styles.closeButton} onClick={handleClose}>
              ×
            </button>
            <div className={styles.popupContent}>
              <p className={styles.popupText}>この報酬と交換しますか？</p>
              <p className={styles.popupText}>
                <HiCurrencyYen className={styles.currencyIcon} />
                {point}p
              </p>
            </div>
            <div className={styles.buttonContainer}>
              <button className={styles.button} onClick={handleClose}>
                交換
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RewardComponent;
