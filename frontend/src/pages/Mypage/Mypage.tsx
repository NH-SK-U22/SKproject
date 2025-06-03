import React from 'react'
import styles from './mypage.module.css'
import Sidebar from '../../components/Sidebar/Sidebar'

const Mypage = () => {
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
        <div className={styles.bottom}>
          <div className={styles.card}>
            <div className={styles.card_image}></div>
            <div className={styles.card_text}>使用する</div>
          </div>
          <div className={styles.card}>
            <div className={styles.card_image}></div>
            <div className={styles.card_text}>使用する</div>
          </div>
          <div className={styles.card}>
            <div className={styles.card_image}></div>
            <div className={styles.card_text}>使用する</div>
          </div>
          <div className={styles.card}>
            <div className={styles.card_image}></div>
            <div className={styles.card_text}>使用する</div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Mypage