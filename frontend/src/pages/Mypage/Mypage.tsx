import React, { useState } from 'react'
import styles from './mypage.module.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import Card from '../../components/Mypage/Card'
import Progressbar from '../../components/Mypage/Progressbar'
import itist from '../../../public/images/1st.png'
import Popup from '../../components/Mypage/Popup'
import RewardComponent from "../../components/Reward/RewardComponent";

const Mypage = () => {
  const [tabs,setTabs]=useState(0)
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
  return (
    <div className={styles.vh}>
      <Sidebar/>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.icon_circle}></div>
          <div className={styles.status_container}>
            <div className={styles.status_left}>
              <p>あなたは</p>
              <div className={styles.rankimg}>
                <p className={styles.rank}>プラチナランク</p>
                <img src={itist} alt="" width={50} />
              </div>
              <p>です</p>
            </div>
            <div className={styles.status_right}>
              <p>次のxxxランクへは</p>
              {/* <p className={styles.points}>あと、500pt</p> */}
              <Progressbar  remaining={500} target={2000} />
            </div>
            <Popup/>
          </div>
        </div>

        {/* タブボタン */}
        <div className={styles.tabs}>
          <button className={`${styles.tab_button}${tabs === 0 ? ` ${styles.active}` : ''}`} onClick={()=>{setTabs(0)}}>カード表示</button>
          <button className={`${styles.tab_button}${tabs === 1 ? ` ${styles.active}` : ''}`} onClick={()=>{setTabs(1)}}>発言履歴</button>
        </div>
        {tabs===0?(
          <div id="cards" className={`${styles.tab_content} ${tabs === 0 ? ` ${styles.active}` : ''}`}>
            
            <div className={styles.bottom}>
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
          </div>):""}
        
        {tabs===1?(
          <div id="history" className={`${styles.tab_content} ${tabs === 1 ? ` ${styles.active}` : ''}`}>
            <ul className={styles.history_list}>
              <li className={styles.history_item}>チョコたっぷり: 美味しいと思います</li>
              <li className={styles.history_item}>FIFA: ボール持ったフランスのが持ってない日本より速いです</li>
              <li className={styles.history_item}>きのこ派: 手が汚れにくいですよね???</li>
              <li className={styles.history_item}>発言履歴で評価の数(kanさんの作ってくれたやつの顔の奴、)過去ランク</li>
            </ul>
          </div>):""}

    </div>
    </div>
  )
}

export default Mypage