import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import RewardComponent from "../../components/Reward/RewardComponent";
import styles from "./Reward.module.css";

interface Rewarddata {
  rewardInfo: string;
  point: number;
}

const RewardData: Rewarddata[] = [
  {
    rewardInfo: "報酬1",
    point: 50,
  },
  {
    rewardInfo: "報酬2",
    point: 100,
  },
  {
    rewardInfo: "報酬3",
    point: 150,
  },
  {
    rewardInfo: "報酬4",
    point: 200,
  },
];

const Reward = () => {
  return (
    <>
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.up}>
          <div className={styles.reward}>
            <p className={styles.rewardp}>報酬</p>
          </div>
          <div className={styles.point}>
            <p className={styles.pointp}>保有ポイント：200</p>
          </div>
        </div>
        <div className={styles.down}>
          <div className={styles.rewardContainer}>
            {RewardData.map((reward, index) => (
              <RewardComponent
                key={index}
                rewardInfo={reward.rewardInfo}
                point={reward.point}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reward;
