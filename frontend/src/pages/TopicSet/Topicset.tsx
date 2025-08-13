import { Box, Container, Typography } from "@mui/material";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import TopicList from "../../components/TopicList/TopicList";

const TopicSet = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <TeacherSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          height: "100vh",
          overflow: "auto",
          ml: "70px",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 4,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "900px" }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                textAlign: "left",
                mb: 4,
              }}
            >
              討論テーマ設定
            </Typography>
            <TopicList />
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default TopicSet;
