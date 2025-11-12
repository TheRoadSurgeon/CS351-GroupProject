import { useState } from "react";
import { BrowserRouter, Routes, Route} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import FoodBanks from "./pages/FoodBanks";
import LeaderBoard from "./pages/Leaderboard";
import Topbar from "./components/Topbar";
import Sidebar from "./components/SideBar";


import DonationForm from "./pages/DonationForm";


import './App.css';

// TODO: move logo from sidebar to dashboard.
// TODO: Add leaderboard to the options

export default function App() 
{
  const [page, setPage] = useState("Dashboard");

  const switchPage = (pg) => {
    console.log("switchPage →", pg);
    switch(pg)
    {
      case "Dashboard":
        return <Dashboard />
          
      case "Food Banks":
        return <FoodBanks />
      
      case "Leaderboard":
        return <LeaderBoard/>
      
      case "Donation Form":
        return <DonationForm />

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
        <Topbar page={page} />
        

        <div id="mainContent">{switchPage(page)}</div>
      </div>
    </div>
  )
}

