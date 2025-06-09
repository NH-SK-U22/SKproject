import React, { useState } from "react";
import styles from "./RewardComponent.module.css"

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

    return (
        <>
            <div className={styles.container} onClick={handleClick}>
                <div className={styles.up}>
                    <p className={styles.rewardtxt}>{rewardInfo}</p>
                </div>
                <div className={styles.down}>
                    <p className={styles.point}>{point}p</p>
                </div>
            </div>

            {showPopup && (
                <div className={styles.overlay}>
                    <div className={styles.popup}>
                        <p className={styles.popupText}>この報酬と交換しますか？</p>
                        <p className={styles.popupText}>必要ポイント：{point}p</p>
                        <div className={styles.buttonContainer}>
                            <button className={styles.button} onClick={handleClose}>Yes</button>
                            <button className={styles.button} onClick={handleClose}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RewardComponent;