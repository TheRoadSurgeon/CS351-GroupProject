import Dashboard from "./pages/Dashboard";
import FoodBanks from "./pages/FoodBanks";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";


import './App.css';

function App() 
{
  return (
    <div id="app">
      <div>
        <Sidebar />
      </div>

      <div id="mainAndNav">
        <Topbar />

        {/* <Dashboard /> */}
        <div id="mainContent">

        </div>

      </div>
    </div>
  )
}

export default App
