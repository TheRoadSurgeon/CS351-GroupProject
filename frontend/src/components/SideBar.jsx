import 'react'
import './components.css';

function Sidebar({setPage}) {
  return (
    <div id="sidebar">

        <div id="logo">
            {/* logo */}
            <h1>Food Bank Helper</h1>
        </div>

        <div id="sidebarbuttons">
            <button onClick={() => setPage("dashboard") }   >Dashboards</button>
            <button onClick={() => setPage("foodbank") }    >Foodbanks</button>
            <button onClick={() => setPage("leaderboard")}  >Leaderboard</button>
        </div>      

        <div id="signout">
            <button>Sign Out</button>
        </div>
    
    </div>
  )
}

export default Sidebar
