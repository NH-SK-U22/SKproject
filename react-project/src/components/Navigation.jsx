import React from 'react';
import { AppBar, Box, Toolbar, Typography, Button } from '@mui/material';

function Navigation() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            アプリ名
          </Typography>
          {/* 疑似ボタン */}
          <Button color="inherit">ホーム</Button>
          <Button color="inherit">機能A</Button>
          <Button color="inherit">設定</Button>
          <Button color="inherit">ログイン</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navigation;
