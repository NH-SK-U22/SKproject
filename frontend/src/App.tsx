import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import Signin from "./components/Signin/Signin";
import Dashboard from "./components/Dashboard/Dashboard";
import SelectUsrtype from "./components/SelectUsertype/SelectUsertype";
import Loading from "./components/Loading/Loading";
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
        </Routes>
      </Router>
    </>
  );
}

export default App;
