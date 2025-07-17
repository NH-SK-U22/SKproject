import React, {useEffect, useState} from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import TeacherRewardComponent from "../../components/TeacherReward/TeacherRewardComponent";
import RewardComponent from "../../components/Reward/RewardComponent";
import styles from "./Reward.module.css";
import { getCurrentUser, type User } from "../../utils/auth";

interface Rewarddata {
  reward_id: number;
  reward_content: string;
  need_point: number;
  need_rank: number;
  creater: number;
  point: number;
}

const Reward = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rewards,setRewards] = useState<Rewarddata[]>([]);

  const fetchRewards = () => {
    fetch("http://localhost:5000/api/rewards")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setRewards(data);
      }
    });
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  },[]);

  useEffect(() => {
    fetchRewards();
  },[]);
  
  return (
    <>
      {currentUser?.user_type === "teacher" ? <TeacherSidebar /> : <Sidebar />}
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
            {rewards.map((reward) => (
              <RewardComponent
                key={reward.reward_id}
                rewardInfo={reward.reward_content}
                point={reward.need_point}
                rank={reward.need_rank}
                reward_id={reward.reward_id}
                onDelete={(id) => setRewards((prev) => prev.filter((r) => r.reward_id !== id))}
              />
            ))}
          </div>
        </div>
      </div>
      {currentUser?.user_type === "teacher" ? (
        <TeacherRewardComponent fetchRewards={fetchRewards} />
      ) : null}
    </>
  );
};

export default Reward;
