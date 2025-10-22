import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import FoodBanks from "./pages/FoodBanks";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";


import './App.css';

function App() 
{
  const [page, setPage] = useState("dashboard");

  // TODO: move logo from sidebar to dashboard.

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

        <Dashboard
        />
        <div id="mainContent">

        </div>

      </div>
    </div>
  )
}

export default App
