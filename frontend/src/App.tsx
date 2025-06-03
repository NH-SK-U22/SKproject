import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signin from "./pages/Signin/Signin";
import Dashboard from "./pages/Dashboard/Dashboard";
import SelectUsrtype from "./components/SelectUsertype/SelectUsertype";
import Loading from "./components/Loading/Loading";
import Reward from "./pages/Reward/Reward";
import TeacherReward from "./pages/TeacherReward/TeacherReward";
import StudentList from "./pages/StudentList/StudentList";
import "./App.css";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usertypeSelect" element={<SelectUsrtype />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/Reward" element={<Reward />} />
          <Route path="/TeacherReward" element={<TeacherReward />} />
          <Route path="/StudentList" element={<StudentList />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;