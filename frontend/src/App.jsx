import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import FoodBanks from "./pages/FoodBanks";
// import LeaderBoard from "./pages/Leaderboard";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";

import './App.css';

// TODO: move logo from sidebar to dashboard.
// TODO: Add leaderboard to the options

function App() 
{
  const [page, setPage] = useState("dashboard");

  const switchPage = (pg) => {
  switch(pg)
  {
    case "dashboard":
      return <Dashboard />
        
    case "foodbank":
      return <FoodBanks />
    
    // case "leaderboard":
    //   return <LeaderBoard/>

    default:
      return <Dashboard />
  }
}

  return (
    <div id="app">
      <div>
        <Sidebar
          setPage={setPage}
        />
      </div>

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
