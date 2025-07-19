import React, { useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useDebateTheme } from "../../context/DebateThemeContext";
import Box from "@mui/material/Box";

const Home: React.FC = () => {
  const { fetchTheme, theme } = useDebateTheme();

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  useEffect(() => {
    if (theme) {
      const startJST = new Date(theme.start_date)
      const endJST = new Date(theme.end_date)
      console.log("start_date (JST):", startJST);
      console.log("end_date (JST):", endJST);
    }
  }, [theme]);

  console.log()
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex={1} p={3}>
        {/* ここにHome画面の内容を追加 */}
        <h2>ホーム画面</h2>
      </Box>
    </Box>
  );
};

export default Home;
