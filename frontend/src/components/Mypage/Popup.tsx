import React, { useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import styles from '../../pages/Mypage/mypage.module.css'

const Popup = () => {
   const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Button variant="contained" onClick={handleOpen} sx={{
    bgcolor: '#999',  }}>
        過去のランク
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>過去ランク</DialogTitle>
        <DialogContent>
           <ul className={styles.history_list}>
              <li className={styles.history_item}>たけのこ/きのこ:ダイヤランク</li>
              <li className={styles.history_item}>室内/外:ダイヤランク</li>
            </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Popup