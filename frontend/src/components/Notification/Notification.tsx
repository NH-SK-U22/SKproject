import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Fade,
  IconButton,
} from "@mui/material";
import { FaRegBell } from "react-icons/fa";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";

const StyledPaper = styled(Paper)(({ theme }) => ({
  position: "fixed",
  left: "70px",
  top: "0",
  width: "300px",
  height: "50vh",
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow:
    theme.palette.mode === "dark"
      ? "2px 0 8px rgba(0,0,0,0.35)"
      : "2px 0 5px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  zIndex: 9999,
  transition: "left 0.3s",
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  flexShrink: 0,
  "& svg": {
    display: "flex",
    alignItems: "center",
    marginTop: "2px",
  },
}));

const NotificationList = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: 0,
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.mode === "dark" ? "#1f2937" : "#f1f1f1",
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.palette.mode === "dark" ? "#555" : "#888",
    borderRadius: "4px",
  },
}));

interface NotificationData {
  notification_id: number;
  student_id: number;
  reward_id: number;
  notification_content: string;
  is_read: boolean;
  saved_time: string;
}

interface NotificationProps {
  onClose?: () => void;
  isSidebarExpanded?: boolean;
}

const Notification = ({ onClose, isSidebarExpanded }: NotificationProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  // 時間を相対的に表示する関数
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "今";
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  };

  // 通知を取得
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const userObj = userJson ? JSON.parse(userJson) : null;
    
    if (!userObj || userObj.user_type !== "teacher") {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/notifications/${userObj.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("通知の取得に失敗しました");
        return res.json() as Promise<NotificationData[]>;
      })
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 通知を既読にする
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      
      // ローカル状態を更新
      setNotifications(prev => 
        prev.map(notification => 
          notification.notification_id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("通知の既読処理に失敗しました:", err);
    }
  };

  return (
    <StyledPaper
      elevation={3}
      sx={{
        left: isSidebarExpanded ? "220px" : "70px",
      }}
    >
      <NotificationHeader>
        <FaRegBell color="#00e6b8" size={22} />
        <Typography
          variant="h6"
          color="text.primary"
          sx={{
            flexGrow: 2,
            fontFamily: '"Noto Sans JP", sans-serif',
            display: "flex",
            alignItems: "center",
            fontSize: "1.1rem",
            fontWeight: 500,
          }}
        >
          通知
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            "&:hover": {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </NotificationHeader>
      <NotificationList>
        {loading ? (
          <ListItem>
            <ListItemText
              primary="読み込み中..."
              primaryTypographyProps={{
                color: "text.secondary",
                fontFamily: '"Noto Sans JP", sans-serif',
              }}
            />
          </ListItem>
        ) : notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <Fade in={true} timeout={500} key={notification.notification_id}>
              <div>
                <ListItem
                  alignItems="flex-start"
                  onClick={() => markAsRead(notification.notification_id)}
                  sx={{
                    py: 2,
                    px: 2,
                    cursor: "pointer",
                    backgroundColor: notification.is_read ? "transparent" : "rgba(0, 230, 184, 0.1)",
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                    "& .MuiListItemIcon-root": {
                      minWidth: "32px",
                      marginTop: "3px",
                    },
                  }}
                >
                  <ListItemIcon>
                    <FaRegBell
                      size={18}
                      style={{
                        marginTop: "4.5px",
                        color: notification.is_read ? "var(--text-secondary)" : "#00e6b8",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.notification_content}
                    secondary={getRelativeTime(notification.saved_time)}
                    primaryTypographyProps={{
                      variant: "body1",
                      color: "text.primary",
                      fontFamily: '"Noto Sans JP", sans-serif',
                      lineHeight: 1.4,
                      fontSize: "0.95rem",
                      fontWeight: notification.is_read ? 400 : 500,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: '"Noto Sans JP", sans-serif',
                      marginTop: "4px",
                      display: "block",
                    }}
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </div>
            </Fade>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="通知はありません"
              primaryTypographyProps={{
                color: "text.secondary",
                fontFamily: '"Noto Sans JP", sans-serif',
                textAlign: "center",
              }}
            />
          </ListItem>
        )}
      </NotificationList>
    </StyledPaper>
  );
};

export default Notification;
