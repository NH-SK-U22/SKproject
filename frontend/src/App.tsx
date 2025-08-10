// react
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// component
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import SelectUsrtype from "./components/SelectUsertype/SelectUsertype";
import Loading from "./components/Loading/Loading";
import Reward from "./pages/Reward/Reward";
import StudentList from "./pages/StudentList/StudentList";
import Signup from "./pages/Signup/Signup";
import Create from "./pages/Create/Create";
import Setting from "./pages/Setting/Setting";
import TopicSet from "./pages/TopicSet/Topicset";
import CampSelect from "./pages/CampSelect/CampSelect";
import Result from "./pages/Result/Result";

import { PostProvider } from "./context/PostContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { DebateThemeProvider } from "./context/DebateThemeContext";
// css
import "./App.css";
import Mypage from "./pages/Mypage/Mypage";
import Home from "./pages/Home/Home";
import Studentdata from "./pages/Studentdata/Studentdata";

function App() {
  return (
    <ThemeProvider>
      <DebateThemeProvider>
        <PostProvider>
          <ChatProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/usertypeSelect" element={<SelectUsrtype />} />
                <Route path="/loading" element={<Loading />} />
                <Route path="/Reward" element={<Reward />} />
                <Route path="/StudentList" element={<StudentList />} />
                <Route path="/mypage" element={<Mypage />} />
                <Route path="/create" element={<Create />} />
                <Route path="/setting" element={<Setting />} />
                <Route path="/topicset" element={<TopicSet />} />
                <Route path="/campselect" element={<CampSelect />} />
                <Route path="/result" element={<Result />} />
                <Route path="/home" element={<Home />} />
                <Route path="/studentdata/:studentId" element={<Studentdata />} />
              </Routes>
            </Router>
          </ChatProvider>
        </PostProvider>
      </DebateThemeProvider>
    </ThemeProvider>
  );
}

export default App;
