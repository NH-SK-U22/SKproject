import React, { useEffect } from 'react';
import axios from 'axios';
import Navigation from './components/Navigation'; // Navigation.jsx のパスを正しく指定してください
import {Container, Typography} from '@mui/material'; // コンテンツ用のコンテナ

function App() {
  useEffect(() => {
    // Flask サーバーのエンドポイント (通常は http://127.0.0.1:5000/)
    const apiUrl = 'http://127.0.0.1:5000/';

    // axios を使って GET リクエストを送信
    axios.get(apiUrl)
      .then(response => {
        // 成功した場合、レスポンスデータをコンソールに表示
        console.log(response.data);
      })
      .catch(error => {
        // エラーが発生した場合、エラーメッセージをコンソールに表示
        console.error('Error fetching data:', error);
      });
  }, []); // 空の依存配列 [] を指定して、コンポーネントのマウント時にのみ実行

  return (
    <div className="App">
      <p>コンソールを確認してください。</p>
      <Navigation />
      {/* ナビゲーションバー以下のコンテンツエリア */}
      <Container sx={{ mt: 4 }}> {/* 上部にマージンを追加 */}
        <Typography variant="h4" component="h1" gutterBottom>
          メインコンテンツエリア
        </Typography>
        <Typography variant="body1">
          ここにアプリケーションの主要なコンテンツが表示されます。
        </Typography>
        {/* 他のコンポーネントや要素をここに追加できます */}
      </Container>
    </div>
  );
}

export default App;
