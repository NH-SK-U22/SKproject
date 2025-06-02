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
  IconButton
} from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(() => ({
  position: 'fixed',
  left: '70px',
  top: '0',
  width: '300px',
  height: '50vh',
  borderLeft: '1px solid #e0e0e0',
  backgroundColor: 'white',
  boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 9999,
  transition: 'left 0.3s',
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  padding: theme.spacing(2),
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexShrink: 0,
}));

const NotificationList = styled(List)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: 0,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '4px',
  },
}));

interface NotificationProps {
  onClose?: () => void;
  isSidebarExpanded?: boolean;
}

const Notification = ({ onClose, isSidebarExpanded }: NotificationProps) => {
  const notifications = [
    { id: 1, text: '新しいメッセージが届きました', time: '10分前' },
    { id: 2, text: 'タスクの期限が近づいています', time: '30分前' },
    { id: 3, text: 'プロジェクトが更新されました', time: '1時間前' },
    { id: 3, text: 'プロジェクトが更新されました', time: '1時間前' },
    { id: 3, text: 'プロジェクトが更新されました', time: '1時間前' },
    { id: 3, text: 'プロジェクトが更新されました', time: '1時間前' },
    { id: 3, text: 'プロジェクトが更新されました', time: '1時間前' },
  ];

  return (
    <StyledPaper 
      elevation={3} 
      sx={{ 
        left: isSidebarExpanded ? '220px' : '70px'
      }}
    >
      <NotificationHeader>
        <NotificationsIcon color="primary" />
        <Typography variant="h6" color="text.primary" sx={{ flexGrow: 1 }}>
          通知
        </Typography>
        <IconButton 
          onClick={onClose}
          size="small"
          sx={{ 
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </NotificationHeader>
      <NotificationList>
        {notifications.map((notification, index) => (
          <Fade in={true} timeout={500} key={notification.id}>
            <div>
              <ListItem 
                alignItems="flex-start"
                sx={{
                  py: 2,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon>
                  <NotificationsIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={notification.text}
                  secondary={notification.time}
                  primaryTypographyProps={{
                    variant: 'body1',
                    color: 'text.primary',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
            </div>
          </Fade>
        ))}
      </NotificationList>
    </StyledPaper>
  );
}

export default Notification;