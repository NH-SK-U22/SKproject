import React, { useState } from 'react'
import styles from './mypage.module.css'
import Sidebar from '../../components/Sidebar/Sidebar'
import Card from '../../components/Mypage/Card'

const Mypage = () => {
  const [tabs,setTabs]=useState(0)
  return (
    <div>
      <Sidebar/>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.icon_circle}></div>
          <div className={styles.status_container}>
            <div className={styles.status_left}>
              <p>あなたは</p>
              <p className={styles.rank}>プラチナランク</p>
              <p>です</p>
            </div>
            <div className={styles.status_right}>
              <p>次のxxxランクへは</p>
              <p className={styles.points}>あと、500pt</p>
              <p>です</p>
            </div>
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
              <Card text="それ" point={6} click="/mypage"/>
              <Card text="それ" point={6} click="/mypage"/>
              <Card text="それ" point={6} click="/mypage"/>
              <Card text="それ" point={6} click="/mypage"/>
            </div>
          </div>):""}
        
        {tabs===1?(
          <div id="history" className={`${styles.tab_content} ${tabs === 1 ? ` ${styles.active}` : ''}`}>
            <ul className={styles.history_list}>
              <li className={styles.history_item}>チョコたっぷり: 美味しいと思います</li>
              <li className={styles.history_item}>FIFA: ボール持ったフランスのが持ってない日本より速いです</li>
              <li className={styles.history_item}>きのこ派: 手が汚れにくいですよね???</li>
              <li className={styles.history_item}>タスク:ランクの表示画像、残りのポイントプログレスバー</li>
            </ul>
          </div>):""}

    </div>
    </div>
  )
}

export default Mypage