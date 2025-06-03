import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signin from "./pages/Signin/Signin";
import Dashboard from "./pages/Dashboard/Dashboard";
import SelectUsrtype from "./components/SelectUsertype/SelectUsertype";
import Loading from "./components/Loading/Loading";
import "./App.css";
import Mypage from "./pages/Mypage/Mypage";

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
          <Route path="/mypage" element={<Mypage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
