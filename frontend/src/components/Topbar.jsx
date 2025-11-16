import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

function Topbar({page}) 
{
  const { user, signOut, getUserRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userEmail = user?.email || '';
  const userInitials = userEmail.substring(0, 2).toUpperCase();
  const userRole = getUserRole();

  return (
    <div id="topbar">
      <div className="topbar-content">
        <div className="page-info">
          <h1 className="page-title">{page}</h1>
        </div>

        <div className="topbar-actions">
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
            {userRole && <span className="user-role">({userRole})</span>}
          </div>
          <div className="user-profile">
            <div className="avatar">{userInitials}</div>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </div>
  )
}

export default Topbar