import React, { useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import { useDebateTheme } from "../../context/DebateThemeContext";
import Box from "@mui/material/Box";
import { getCurrentUser } from "../../utils/auth";

const Home: React.FC = () => {
  const { fetchTheme, theme } = useDebateTheme();

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  useEffect(() => {
    if (theme) {
      const startJST = new Date(theme.start_date);
      const endJST = new Date(theme.end_date);
      console.log("start_date (JST):", startJST);
      console.log("end_date (JST):", endJST);
    }
  }, [theme]);

  console.log();
  return (
    <Box display="flex">
      {getCurrentUser()?.user_type === "teacher" ? (
        <TeacherSidebar />
      ) : (
        <Sidebar />
      )}
      <Box
        flex={1}
        p={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <img
          src="/src/assets/Education.svg"
          alt="Education"
          style={{
            width: "80%",
            maxWidth: "600px",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </Box>
    </Box>
  );
};

export default Home;
