import React, { useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'

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
        <DialogTitle>ポップアップタイトル</DialogTitle>
        <DialogContent>
          <p>ここに好きなコンテンツを置けます。</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Popup