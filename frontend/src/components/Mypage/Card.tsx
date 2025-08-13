import React from "react";
import styles from "../../pages/Mypage/mypage.module.css";
import { redirect } from "react-router-dom";

const Card = ({
  text,
  point,
  click,
}: {
  text: string;
  point: number;
  click: string;
}) => {
  return (
    <div
      className={styles.container_card}
      onClick={() => {
        redirect({ click });
      }}
    >
      <div className={styles.card_up}>
        <p className={styles.rewardtxt}>{text}</p>
      </div>
      <div className={styles.card_down}>
        {/* <p className={styles.card_point}>{point}p</p> */}
        <p className={styles.card_point}>使う</p>
      </div>
    </div>
  );
};

export default Card;
