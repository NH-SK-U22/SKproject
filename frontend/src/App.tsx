import { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null); // バックエンドからのメッセージを保持するstate

  // useEffectを使ってコンポーネントのマウント時にデータを取得
  useEffect(() => {
    // バックエンドAPIのエンドポイント
    const apiUrl = 'http://localhost:5000/'; // app.pyのルートパス

    axios.get(apiUrl)
      .then(response => {
        // 成功した場合、レスポンスデータをコンソールに表示
        console.log('Data from backend:', response.data);
        // 必要であればstateに保存
        setMessage(response.data.status);
      })
      .catch(error => {
        // エラーが発生した場合、エラーをコンソールに表示
        console.error('Error fetching data:', error);
        setMessage('Failed to fetch data');
      });
  }, []); // 空の依存配列は、このeffectがマウント時に一度だけ実行されることを意味します

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          数える {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        {/* バックエンドからのメッセージを表示 */}
        {message && <p>Backend says: {message}</p>}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
