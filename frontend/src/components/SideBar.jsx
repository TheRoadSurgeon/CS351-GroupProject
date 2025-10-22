import './components.css';

function Sidebar() 
{
  return (
    <div id="sidebar">

        <div id="logo">
            {/* logo */}
            <h1>Food Bank Helper</h1>
        </div>

        <div id="sidebarbuttons">
            <button>Dashboards</button>
            <button>Foodbanks</button>
            <button>Leaderboard</button>
        </div>      

        <div id="signout">
            <button>Sign Out</button>
        </div>
    
    </div>
  )
}

export default Sidebar
