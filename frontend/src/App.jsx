import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import FoodBanks from "./pages/FoodBanks";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import './App.css';

function App() {
  const [page, setPage] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState("login"); // 'login' or 'signup'
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    // TODO: Implement actual login API call
    console.log('Login with:', userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignup = (userData) => {
    // TODO: Implement actual signup API call
    console.log('Signup with:', userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const switchPage = (pg) => {
    console.log("switchPage →", pg);
    switch(pg) {
      case "dashboard":
        return <Dashboard />;
      case "foodbank":
        return <FoodBanks />;
      case "leaderboard":
        return <Leaderboard />;
      default:
        return <Dashboard />;
    }
  };

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    if (authPage === "login") {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthPage("signup")}
        />
      );
    } else {
      return (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setAuthPage("login")}
        />
      );
    }
  }

  // Show main app if authenticated
  return (
    <div id="app">
      <Sidebar setPage={setPage} currentPage={page} />
      <div id="mainAndNav">
        <Topbar page={page} user={user} onLogout={handleLogout} />
        <div id="mainContent">{switchPage(page)}</div>
      </div>
    </div>
  );
}

export default App;