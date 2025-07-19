import React from "react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Box from "@mui/material/Box";

const Result: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex={1} p={3} textAlign="center" mt={10}>
        <h2>討論期間が終了しました</h2>
        <Button variant="contained" color="primary" onClick={() => navigate("/home")}>ホームへ戻る</Button>
      </Box>
    </Box>
  );
};

export default Result;
