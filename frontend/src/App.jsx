import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardDonor from "./pages/DashboardDonor";
import DashboardFoodBank from "./pages/DashboardFoodBank";
import FoodBanks from "./pages/FoodBanks";
import LeaderBoard from "./pages/Leaderboard";
import Topbar from "./components/Topbar";
import Sidebar from "./components/SideBar";
import DonationForm from "./pages/DonationForm";

import Login from "./pages/Login";
import Register from "./pages/Register";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import './App.css';

export default function App() 
{
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function MainApp()
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

