import './Topbar.css';

function Topbar({ page, user, onLogout }) {
  return (
    <div id="topbar">
      <div className="topbar-content">
        <div className="page-info">
          <h1 className="page-title">{page}</h1>
          <p className="page-subtitle">Food Bank Helper</p>
        </div>

        <div className="topbar-actions">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
            <button className="search-btn">🔍</button>
          </div>
          <div className="user-profile">
            <span className="user-name">Welcome, {user?.name || 'User'}</span>
            <div className="avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              ↪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;