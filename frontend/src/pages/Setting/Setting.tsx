import React from 'react'
import { useState } from 'react' 
import { Box, Typography, Paper, Container, Divider, TextField } from '@mui/material'
import Sidebar from '../../components/Sidebar/Sidebar'
import { DarkLightTogle } from '../../components/DarkLightTogle/DarkLightTogle'
import { LanguageTogle } from '../../components/LanguageTogle/LanguageTogle'
import { NotificationAgree } from '../../components/NotificationAgree/NotificationAgree'
import { useTheme } from '../../context/ThemeContext'

const Setting = () => {
  const [languageEnabled, setLanguageEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const {darkMode, toggleDarkMode} = useTheme();
  const [colorPalette, setColorPalette] = useState('#0000ff');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            bgcolor: 'background.paper'
          }}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            gutterBottom 
            sx={{ 
              mb: 4,
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            設定
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ minWidth: '100px', fontWeight: 500 }}>テーマ:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Typography sx={{ 
                  minWidth: '50px',
                  textAlign: 'left',
                  color: 'text.secondary'
                }}>
                  {darkMode ? 'ライト' : 'ダーク'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ p: 1, pr: 2 }}>
                    <DarkLightTogle 
                      defaultChecked={!darkMode}
                      onChange={toggleDarkMode}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ minWidth: '100px', fontWeight: 500 }}>通知:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography sx={{ 
                  minWidth: '60px', 
                  textAlign: 'left',
                  color: 'text.secondary'
                }}>
                  {notificationEnabled ? 'オン' : 'オフ'}
                </Typography>
                <NotificationAgree 
                  defaultChecked={notificationEnabled}
                  onChange={setNotificationEnabled}
                />
              </Box>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ minWidth: '100px', fontWeight: 500 }}>言語:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography sx={{ 
                  minWidth: '60px', 
                  textAlign: 'left',
                  color: 'text.secondary'
                }}>
                  {languageEnabled ? '日本語' : '英語'}
                </Typography>
                <LanguageTogle 
                  defaultChecked={languageEnabled}
                  onChange={setLanguageEnabled}
                />
              </Box>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ minWidth: '100px', fontWeight: 500 }}>アイコンカラー:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 , pr: 2.4}}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: colorPalette,
                    borderRadius: 1,
                    mr: 5.7
                  }}
                />
                <TextField
                  type="color"
                  value={colorPalette}
                  onChange={(e) => setColorPalette(e.target.value)}
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '4px',
                      width: '50px',
                      height: '40px',
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Setting
