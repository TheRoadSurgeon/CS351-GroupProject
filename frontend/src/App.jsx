import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import FoodBanks from "./pages/FoodBanks";
import LeaderBoard from "./pages/Leaderboard";
import Topbar from "./components/Topbar";
import Sidebar from "./components/SideBar";

import './App.css';

// TODO: move logo from sidebar to dashboard.
// TODO: Add leaderboard to the options

function App() 
{
  const [page, setPage] = useState("Dashboard");

  const switchPage = (pg) => {
  switch(pg)
  {
    case "Dashboard":
      return <Dashboard />
        
    case "Food Banks":
      return <FoodBanks />
    
    case "Leaderboard":
      return <LeaderBoard/>

    default:
      return <Dashboard />
  }
}

  return (
    <div id="app">
      <Sidebar
        setPage={setPage}
        currentPage={page}
      />

      <div id="mainAndNav">
        <Topbar 
          page={page}
        />

        <div id="mainContent">{switchPage(page)}</div>
      </div>
    </div>
  )
}

export default App
