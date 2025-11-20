import 'react'
import './SideBar.css';

function Sidebar({setPage, currentPage}) {
  return (
    <div id="sidebar">

        <div id="logo">
            {/* logo */}
            <h1>Food Bank Helper</h1>
        </div>

        <div id="sidebarbuttons">
            <button 
              onClick={() => setPage("Dashboard")}
              className={currentPage === "Dashboard" ? "active" : ""}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setPage("Donations")}
              className={currentPage === "Donations" ? "active" : ""}  
            >
              Donations
            </button>
            <button 
              onClick={() => setPage("Food Banks")}
              className={currentPage === "Food Banks" ? "active" : ""}
            >
              Food Banks
            </button>
            <button 
              onClick={() => setPage("Leaderboard")}
              className={currentPage === "Leaderboard" ? "active" : ""}
            >
              Leaderboard
            </button>
        </div>    

        <div id="signout">
            <button>Sign Out</button>
        </div>
    
    </div>
  )
}

export default Sidebar
