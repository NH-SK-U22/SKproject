import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import styles from '../../pages/Mypage/mypage.module.css'
import { computeRank  } from '../../utils/rank'

type RankHistory = {
  history_id: number
  theme_id:   number
  sum_point:  number
  created_at: string
}

type Theme = {
  theme_id: number
  title:    string
}

const Popup = () => {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<RankHistory[]>([])
  const [themes, setThemes]   = useState<Record<number,string>>({})
  const [error, setError]     = useState<string|null>(null)

  const userJson = localStorage.getItem('user')
  const userObj  = userJson ? JSON.parse(userJson) : null
  const userId: number | undefined = userObj?.id
  const URL = 'http://localhost:5000'

  // ① テーマ一覧を取得してマップ化
  useEffect(() => {
    fetch(`${URL}/api/themes`)
      .then(r => r.ok ? r.json() : Promise.reject('themes取得失敗'))
      .then((ts: Theme[]) => {
        const m: Record<number,string> = {}
        ts.forEach(t => { m[t.theme_id] = t.title })
        setThemes(m)
      })
      .catch(() => {
        // テーマが取れなくても履歴だけは出す
      })
  }, [])

  // ② ダイアログを開いた瞬間に履歴を取得
  useEffect(() => {
    if (!open || !userId) return

    fetch(`${URL}/api/rank_history?student_id=${userId}`)
      .then(r => {
        if (!r.ok) throw new Error('rank_history取得失敗')
        return r.json()
      })
      .then((hist: RankHistory[]) => {
        setHistory(hist)
      })
      .catch(err => {
        console.error(err)
        setError('過去ランクの取得に失敗しました')
      })
  }, [open, userId])

  const handleOpen  = () => { setOpen(true) }
  const handleClose = () => { setOpen(false); setError(null) }

  return (
    <>
      <Button variant="contained" onClick={handleOpen} sx={{ bgcolor: '#999' }}>
        過去のランク
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>過去ランク履歴</DialogTitle>
        <DialogContent dividers>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

          {history.length > 0 ? (
            <ul className={styles.history_list}>
              {history.map(h => {
                const { rankName } = computeRank(h.sum_point)
                return(
                <li key={h.history_id} className={styles.history_item}>
                  {/* テーマ名が取れていればタイトル、それ以外はIDで表示 */}
                  <strong>
                    {themes[h.theme_id] ?? `テーマ${h.theme_id}`}
                  ：</strong> 
                  <span>{h.sum_point}pt{rankName }</span>
                  <small style={{ marginLeft: 8, color: '#666' }}>
                    ({new Date(h.created_at).toLocaleString()})
                  </small>
                </li>
              )})}
            </ul>
          ) : (
            <div>過去ランクの履歴がありません</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Popup
