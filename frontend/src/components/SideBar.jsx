import 'react'
import './SideBar.css';
import logoImage from '../assets/RestockdLogo.png';

function Sidebar({ setPage, currentPage }) {
  return (
    <div id="sidebar">

      <div id="logo">
        <img
          src={logoImage}
          alt="Restockd logo"
          className="logo-image"
        />
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
          onClick={() => setPage("Leaderboard")}
          className={currentPage === "Leaderboard" ? "active" : ""}
        >
          Leaderboard
        </button>
      </div>    
    </div>
  );
}

export default Sidebar
