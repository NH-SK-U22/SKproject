import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// pages
import Login from "./pages/Login/Login";
import Signup from "./pages/Signin/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Create from "./pages/Create/Create";

// components
import SelectUsrtype from "./components/SelectUsertype/SelectUsertype";
import Loading from "./components/Loading/Loading";
import { PostProvider } from "./context/PostContext";

function App() {
  return (
    <PostProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usertypeSelect" element={<SelectUsrtype />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/create" element={<Create />} />
        </Routes>
      </Router>
    </PostProvider>
  );
}

export default App;
