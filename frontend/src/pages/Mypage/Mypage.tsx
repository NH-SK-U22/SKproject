import React, { useEffect, useState } from 'react'
import styles from './mypage.module.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import Card from '../../components/Mypage/Card'
import Progressbar from '../../components/Mypage/Progressbar'
import itist from '../../../public/images/1st.png'
import Popup from '../../components/Mypage/Popup'
import RewardComponent from "../../components/Reward/RewardComponent";

const Mypage = () => {
  type HoldReward = {
  hold_id: number;
  student_id: number;
  reward_id: number;
  is_holding: boolean;
  used_at: string | null;
  // （JOIN して取得した場合は報酬名や必要ポイントもここに追加）
  reward_content?: string;
  need_point?: number;
  need_rank?: number;
};
  const [reward, setReward] = useState<HoldReward[]>([]);
  const [error, setError]     = useState<string|null>(null);
  // ランクの引っ張り、
  const [tabs,setTabs]=useState(0)
  const userJson = localStorage.getItem('user');
  const userObj = userJson ? JSON.parse(userJson) : null;
  const userId = userObj?.id;
  const sumP=userObj?.sum_point

  useEffect(() => {
    console.log('① useEffect start', { userId })  
    fetch(`/api/holdRewards?student_id=${userId}`)
    .then(res => {
      console.log('② holdRewards status', res.status)
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    })
    .then((holds: HoldReward[]) => {
      console.log('③ raw holds:', holds) 
      return Promise.all(
        holds.map(h =>
          
          fetch(`/api/rewards/${h.reward_id}`)
            .then(r => {
              console.log('④ fetching reward for', h.reward_id) 
              if (!r.ok) throw new Error(`Reward ${h.reward_id} fetch failed`);
              console.log(`⑤ reward ${h.reward_id} status`, r.status) 
              return r.json();
            })
            .then(rew => ({
              ...h,
              reward_content: rew.reward_content,
              need_point:     rew.need_point,
              need_rank:      rew.need_rank
            }
          ))
        )
      );
    })
    .then(enriched => {
      console.log('⑥ enriched holds:', enriched) 
      console.log(enriched);
      // enriched は holdReward情報に reward_content, need_point などをマージした配列
      setReward(enriched);
    })
    .catch(err => {
      console.error(err);
      setError('データの取得に失敗しました');
    });

  }, [userId]);
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
                {sumP}
                <img src={itist} alt="" width={50} />
              </div>
              <p>です</p>
            </div>
            <div className={styles.status_right}>
              <p>次のxxxランクへは</p>
              {/* <p className={styles.points}>あと、500pt</p> */}
              <Progressbar  remaining={500-sumP} target={2000} />
            </div>
            {/* 過去ランクの上にログアウトbtn */}
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
                {reward.map(rewa => (
                  <RewardComponent
                    key={rewa.hold_id}
                    rewardInfo={rewa.reward_content ?? ''}
                    point={rewa.need_point??0}
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
              <li className={styles.history_item}>過去ランクの上評価の数</li>
            </ul>
          </div>):""}

    </div>
    </div>
  )
}

export default Mypage