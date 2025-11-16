import { useState } from "react";
import DashboardDonor from "./pages/DashboardDonor";
import DashboardFoodBank from "./pages/DashboardFoodBank";
import FoodBanks from "./pages/FoodBanks";
import LeaderBoard from "./pages/Leaderboard";
import Topbar from "./components/Topbar";
import Sidebar from "./components/SideBar";


import DonationForm from "./pages/DonationForm";


import './App.css';

export default function App() 
{
  const [page, setPage] = useState("Dashboard"); //should be either donor or foodbank, need to change it 

  const switchPage = (pg) => {
    console.log("switchPage →", pg);
    switch(pg)
    {
      case "Dashboard":
        return <DashboardDonor />
          
      case "Food Banks":
        return <FoodBanks />
      
      case "Leaderboard":
        return <LeaderBoard/>
      
      case "Donation Form":
        return <DonationForm />

      default:
        return <DashboardDonor />
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

