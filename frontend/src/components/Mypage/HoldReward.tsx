// src/components/Mypage/HoldReward.tsx
import React, { useState, useEffect } from 'react'
import styles from './HoldReward.module.css'
import bronzeImg from '../../../public/images/3rd.png'
import silverImg from '../../../public/images/2nd.png'
import goldImg from '../../../public/images/1st.png'
import diamondImg from '../../../public/images/diamond.png'

export interface HoldRewardProps {
  hold_id:    number
  rewardInfo: string
  need_rank?: number
  isHolding:  boolean
  onUsed?:    (id: number) => void
}

const HoldReward: React.FC<HoldRewardProps> = ({
  hold_id,
  rewardInfo,
  need_rank = 0,
  isHolding,
  onUsed
}) => {
  const [used, setUsed] = useState(!isHolding)

  // ランク画像を選択
  const getRankImage = () => {
    switch (need_rank) {
      case 3: return diamondImg
      case 2: return goldImg
      case 1: return silverImg
      default: return bronzeImg
    }
  }

  const handleUse = async () => {
    if (used) return
    try {
      const res = await fetch(`http://localhost:5000/api/holdRewards/${hold_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_holding: false, used_at: new Date().toISOString() })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '使用に失敗しました')
      }
      setUsed(true)
      onUsed?.(hold_id)
      alert('報酬を使用しました')
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.imageSection}>
        <img src={getRankImage()} alt="ランク画像" className={styles.rankImage} />
        {used && <div className={styles.soldOverlay}><span className={styles.soldLabel}>使用済</span></div>}
      </div>
      <div className={styles.contentSection}>
        <p className={styles.rewardTitle}>{rewardInfo}</p>
        <button className={styles.redeemButton} onClick={handleUse} disabled={used}>
          {used ? '使用済み' : '使用する'}
        </button>
      </div>
    </div>
  )
}

export default HoldReward

/*
コピーして同ディレクトリに src/components/Mypage/HoldReward.module.css を作成してください:

.container {
  width: 85%; margin: 0 auto 30px; background: #fff;
  border: 1px solid #ddd; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}
.imageSection {
  position: relative; height: 140px;
  display: flex; align-items: center; justify-content: center;
  background: #f5f5f5;
}
.rankImage { width: 80%; }
.soldOverlay {
  position: absolute; top:0; left:0; width:100%; height:100%;
  background: rgba(255,255,255,0.7);
  display:flex; align-items:center; justify-content:center;
}
.soldLabel { color: #e74c3c; font-size:1.5rem; font-weight:bold; }
.contentSection { padding: 1rem; display:flex; flex-direction:column; align-items:center; }
.rewardTitle { font-size:1.2rem; font-weight:600; margin-bottom:1rem; color:#333; }
.redeemButton {
  padding:0.6rem 1.2rem; background:#00e6b8; border:none; border-radius:6px;
  color:#fff; font-weight:700; cursor:pointer;
}
.redeemButton:disabled { background:#ccc; cursor:not-allowed; }
*/
