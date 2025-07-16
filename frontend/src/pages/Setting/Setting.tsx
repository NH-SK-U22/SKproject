import React from "react";
import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import {
  DarkModeOutlined,
  NotificationsOutlined,
  LanguageOutlined,
  PaletteOutlined,
} from "@mui/icons-material";
import { FaUserCircle } from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import { DarkLightTogle } from "../../components/DarkLightTogle/DarkLightTogle";
import { LanguageTogle } from "../../components/LanguageTogle/LanguageTogle";
import { NotificationAgree } from "../../components/NotificationAgree/NotificationAgree";
import { useTheme } from "../../context/ThemeContext";

const Setting = () => {
  const [languageEnabled, setLanguageEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();
  const [colorPalette, setColorPalette] = useState("#f9bc60");

  const handleSubmit = async () => {
    // localStorageからuser情報を取得
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("ログイン情報が見つかりません。再度ログインしてください。");
      return;
    }
    let student_id;
    try {
      const user = JSON.parse(userStr);
      student_id = user.id;
      if (!student_id) {
        alert("ユーザーIDが見つかりません。再度ログインしてください。");
        return;
      }
    } catch {
      alert("ユーザー情報の取得に失敗しました。再度ログインしてください。");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/students/${student_id}/camp`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_color: colorPalette,
            // 必要に応じて他の設定もここに追加
          }),
        }
      );

      // レスポンスの内容をチェック
      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("JSON解析エラー:", parseError);
        console.error("レスポンス内容:", responseText);
        alert("サーバーからの応答が無効です");
        return;
      }

      if (response.ok) {
        alert("設定が保存されました");
      } else {
        alert("エラー: " + (data.error || "保存に失敗しました"));
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラー: " + error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Sidebar />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            bgcolor: "background.paper",
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{
              mb: 4,
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            設定
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: "rgba(0,230,184,0.1)", width: 40, height: 40 }}
                >
                  <DarkModeOutlined sx={{ color: "#00e6b8" }} />
                </Avatar>
                <Typography sx={{ minWidth: "100px", fontWeight: 500 }}>
                  テーマ
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Typography
                  sx={{
                    minWidth: "50px",
                    textAlign: "left",
                    color: "text.secondary",
                  }}
                >
                  {darkMode ? "ライト" : "ダーク"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: "rgba(0,230,184,0.1)", width: 40, height: 40 }}
                >
                  <NotificationsOutlined sx={{ color: "#00e6b8" }} />
                </Avatar>
                <Typography sx={{ minWidth: "100px", fontWeight: 500 }}>
                  通知
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Typography
                  sx={{
                    minWidth: "60px",
                    textAlign: "left",
                    color: "text.secondary",
                  }}
                >
                  {notificationEnabled ? "オン" : "オフ"}
                </Typography>
                <NotificationAgree
                  defaultChecked={notificationEnabled}
                  onChange={setNotificationEnabled}
                />
              </Box>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: "rgba(0,230,184,0.1)", width: 40, height: 40 }}
                >
                  <LanguageOutlined sx={{ color: "#00e6b8" }} />
                </Avatar>
                <Typography sx={{ minWidth: "100px", fontWeight: 500 }}>
                  言語
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Typography
                  sx={{
                    minWidth: "60px",
                    textAlign: "left",
                    color: "text.secondary",
                  }}
                >
                  {languageEnabled ? "日本語" : "英語"}
                </Typography>
                <LanguageTogle
                  defaultChecked={languageEnabled}
                  onChange={setLanguageEnabled}
                />
              </Box>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: "rgba(0,230,184,0.1)", width: 40, height: 40 }}
                >
                  <PaletteOutlined sx={{ color: "#00e6b8" }} />
                </Avatar>
                <Typography sx={{ minWidth: "100px", fontWeight: 500 }}>
                  アイコンカラー
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  mr: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: colorPalette,
                    border: "2px solid #f0f0f0",
                    mr: 3.5,
                  }}
                >
                  <FaUserCircle style={{ color: "white", fontSize: "24px" }} />
                </Avatar>
                <Box
                  sx={{
                    position: "relative",
                    width: 68,
                    height: 40,
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="color"
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "transparent",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: colorPalette,
                      pointerEvents: "none",
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{
                  backgroundColor: "#00e6b8",
                  mr: 2.4,
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#00a484",
                  },
                }}
              >
                送信
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Setting;
