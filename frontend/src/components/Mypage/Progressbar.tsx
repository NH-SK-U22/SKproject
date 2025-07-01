import React from 'react'

import { Box, Typography, LinearProgress } from '@mui/material'


type ProgressBarProps = {
  remaining: number    // 残りポイント
  target: number       // 次ランクに必要な合計ポイント
}

const Progressbar: React.FC<ProgressBarProps> = ({ remaining, target }) => {
  const achieved = target - remaining
  const percent = Math.min(100, Math.max(0, (achieved / target) * 100))

  return (
    <Box sx={{
       width: '100%',
       maxWidth: 400,
       mt: 0,
       p: 0, 
       gap: 0,
     }}>
      <Typography variant="body1"  sx={{
         fontSize: 18,
         fontWeight: 'bold',
         margin: '5px 0',  
         my: 0,                 // 上下マージンゼロ
         textAlign: 'center',
      }}>
        あと{remaining}ptです
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 12,
          borderRadius: 6,
          mt: 0,
          px: 0,
          backgroundColor: '#BBBBBB',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#007bff',
          },
        }}
      />
      <Typography
        variant="caption"
        component="div"
        align="right"
        sx={{ 
          mt: 0,
          top: 0,
          px: 0,
         }}
      >
        {Math.round(percent)}%
      </Typography>
    </Box>
  )
}

export default Progressbar
