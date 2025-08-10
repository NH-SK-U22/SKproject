import { Box, Container, Typography } from "@mui/material";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import TopicList from "../../components/TopicList/TopicList";

const TopicSet = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <TeacherSidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, height: "100vh", overflow: "auto" }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            討論テーマ設定
          </Typography>
          <TopicList />
        </Container>
      </Box>
    </Box>
  );
};

export default TopicSet;
