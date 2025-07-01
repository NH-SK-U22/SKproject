// react
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// component
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import SelectUsrtype from "./components/SelectUsertype/SelectUsertype";
import Loading from "./components/Loading/Loading";
import Reward from "./pages/Reward/Reward";
import TeacherReward from "./pages/TeacherReward/TeacherReward";
import StudentList from "./pages/StudentList/StudentList";
import Signup from "./pages/Signup/Signup";
import Create from "./pages/Create/Create";
import Setting from "./pages/Setting/Setting";
import TopicSet from "./pages/TopicSet/Topicset";
import CampSelect from "./pages/CampSelect/CampSelect";

import { PostProvider } from "./context/PostContext";
import { ThemeProvider } from "./context/ThemeContext";
// css
import "./App.css";
import Mypage from "./pages/Mypage/Mypage";

function App() {
  return (
    <ThemeProvider>
      <PostProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usertypeSelect" element={<SelectUsrtype />} />
            <Route path="/loading" element={<Loading />} />
            <Route path="/Reward" element={<Reward />} />
            <Route path="/TeacherReward" element={<TeacherReward />} />
            <Route path="/StudentList" element={<StudentList />} />
            <Route path="/mypage" element={<Mypage />} />
            <Route path="/create" element={<Create />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/topicset" element={<TopicSet />} />
            <Route path="/campselect" element={<CampSelect />} />
          </Routes>
        </Router>
      </PostProvider>
    </ThemeProvider>
  );
}

export default App;
